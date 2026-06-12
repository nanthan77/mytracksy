/**
 * handleSubscriptionWebhook.ts — Unified Payment Webhook
 *
 * HTTP Cloud Function that receives webhook payloads from:
 *   - PayHere (Sri Lankan gateway — web bypass for Apple's 30% cut)
 *   - RevenueCat (for Apple/Google in-app purchases)
 *
 * Validates signature, updates subscription, and triggers invoice generation.
 */

import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as crypto from "crypto";

const db = admin.firestore();

// ─── Secrets ────────────────────────────────────────────────────
const PAYHERE_MERCHANT_ID = defineSecret("PAYHERE_MERCHANT_ID");
const PAYHERE_MERCHANT_SECRET = defineSecret("PAYHERE_MERCHANT_SECRET");
const REVENUCAT_WEBHOOK_SECRET = defineSecret("REVENUCAT_WEBHOOK_SECRET");

// ─── Pricing ────────────────────────────────────────────────────
type SubscriptionTier = "pro" | "chambers";
type BillingPeriod = "monthly" | "annual";

interface SubscriptionPlan {
    tier: SubscriptionTier;
    monthlyPrice: number;
    annualPrice: number;
    label: string;
}

const DEFAULT_PRO_PLAN: SubscriptionPlan = {
    tier: "pro",
    monthlyPrice: 2900,
    annualPrice: 25000,
    label: "MyTracksy Pro",
};

const SUBSCRIPTION_PRICES: Record<string, Record<SubscriptionTier, SubscriptionPlan | undefined>> = {
    individual: {
        pro: { tier: "pro", monthlyPrice: 1900, annualPrice: 19000, label: "MyTracksy Personal Pro" },
        chambers: undefined,
    },
    legal: {
        pro: { tier: "pro", monthlyPrice: 2900, annualPrice: 29000, label: "MyTracksy Independent Counsel" },
        chambers: { tier: "chambers", monthlyPrice: 9900, annualPrice: 99000, label: "MyTracksy Chambers Plan" },
    },
    medical: {
        pro: { tier: "pro", monthlyPrice: 2900, annualPrice: 25000, label: "MyTracksy Doctor Pro" },
        chambers: undefined,
    },
    aquaculture: {
        pro: { tier: "pro", monthlyPrice: 3900, annualPrice: 39000, label: "MyTracksy Single Farm" },
        chambers: { tier: "chambers", monthlyPrice: 14900, annualPrice: 149000, label: "MyTracksy Commercial Hatchery" },
    },
    tourism: {
        pro: { tier: "pro", monthlyPrice: 2900, annualPrice: 25000, label: "MyTracksy Guide Pro" },
        chambers: { tier: "chambers", monthlyPrice: 9900, annualPrice: 99000, label: "MyTracksy Agency Plan" },
    },
    travel: {
        pro: { tier: "pro", monthlyPrice: 2900, annualPrice: 25000, label: "MyTracksy Guide Pro" },
        chambers: { tier: "chambers", monthlyPrice: 9900, annualPrice: 99000, label: "MyTracksy Agency Plan" },
    },
    studios: {
        pro: { tier: "pro", monthlyPrice: 6900, annualPrice: 69000, label: "MyTracksy Premium Wedding Pro" },
        chambers: { tier: "chambers", monthlyPrice: 19900, annualPrice: 199000, label: "MyTracksy Pvt Ltd Studio" },
    },
};

function normalizeBillingPeriod(value: unknown): BillingPeriod {
    return value === "annual" ? "annual" : "monthly";
}

function normalizeTier(value: unknown): SubscriptionTier {
    return value === "chambers" ? "chambers" : "pro";
}

function isPayHereCheckoutEnabled(): boolean {
    return process.env.PAYHERE_CHECKOUT_ENABLED === "true";
}

function getSubscriptionPlan(professionValue: unknown, tierValue: unknown): SubscriptionPlan {
    const profession = typeof professionValue === "string" ? professionValue : "individual";
    const tier = normalizeTier(tierValue);
    return SUBSCRIPTION_PRICES[profession]?.[tier] || DEFAULT_PRO_PLAN;
}

function parsePlanMetadata(custom2: unknown): {
    profession: string;
    tier: SubscriptionTier;
    planType: BillingPeriod;
    plan: SubscriptionPlan;
} {
    if (typeof custom2 === "string" && custom2.startsWith("subscription:")) {
        const [, profession = "individual", tierValue = "pro", periodValue = "monthly"] = custom2.split(":");
        const tier = normalizeTier(tierValue);
        const planType = normalizeBillingPeriod(periodValue);
        const plan = getSubscriptionPlan(profession, tier);
        return {
            profession,
            tier: plan.tier,
            planType,
            plan,
        };
    }

    const planType = normalizeBillingPeriod(custom2);
    const plan = getSubscriptionPlan("individual", "pro");
    return {
        profession: "individual",
        tier: plan.tier,
        planType,
        plan,
    };
}

function amountCents(plan: SubscriptionPlan, planType: BillingPeriod): number {
    return (planType === "annual" ? plan.annualPrice : plan.monthlyPrice) * 100;
}

function periodDays(planType: BillingPeriod): number {
    return planType === "annual" ? 365 : 30;
}

function nextPeriodEnd(planType: BillingPeriod, payHereNextDate?: string): admin.firestore.Timestamp {
    if (payHereNextDate) {
        const parsed = new Date(payHereNextDate);
        if (!Number.isNaN(parsed.getTime())) {
            return admin.firestore.Timestamp.fromDate(parsed);
        }
    }

    const fallback = new Date();
    fallback.setDate(fallback.getDate() + periodDays(planType));
    return admin.firestore.Timestamp.fromDate(fallback);
}

// ─── PayHere Signature Verification ─────────────────────────────
function verifyPayHereSignature(
    merchantId: string,
    orderId: string,
    amount: string,
    currency: string,
    statusCode: string,
    merchantSecret: string,
    receivedMd5: string
): boolean {
    // PayHere md5sig = MD5(merchant_id + order_id + amount + currency + status_code + MD5(merchant_secret))
    const secretHash = crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

    const rawString = merchantId + orderId + amount + currency + statusCode + secretHash;
    const computedHash = crypto
        .createHash("md5")
        .update(rawString)
        .digest("hex")
        .toUpperCase();

    if (!receivedMd5 || receivedMd5.length !== computedHash.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'utf8'),
        Buffer.from(receivedMd5.toUpperCase(), 'utf8')
    );
}

// ─── RevenueCat Signature Verification ──────────────────────────
function verifyRevenueCatSignature(
    body: string,
    signature: string,
    secret: string
): boolean {
    const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

// ─── Cloud Function ─────────────────────────────────────────────

export const handleSubscriptionWebhook = onRequest(
    {
        region: "asia-south1",
        memory: "256MiB",
        secrets: [PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET, REVENUCAT_WEBHOOK_SECRET],
        cors: false,
    },
    async (req, res) => {
        if (req.method !== "POST") {
            res.status(405).send("Method not allowed");
            return;
        }

        try {
            // ── Detect provider based on payload shape ──
            const isRevenueCat = req.headers["x-revenuecat-webhook-authorization"] !== undefined
                || (req.body && req.body.event);
            const isPayHere = req.body && req.body.merchant_id && req.body.md5sig;

            if (isPayHere) {
                if (!isPayHereCheckoutEnabled()) {
                    logger.warn("PayHere webhook rejected because MyTracksy checkout is paused");
                    res.status(403).send("PayHere checkout disabled");
                    return;
                }
                await handlePayHereWebhook(req.body);
            } else if (isRevenueCat) {
                const rawBody = JSON.stringify(req.body);
                const sig = (req.headers["x-revenuecat-webhook-authorization"] as string) || "";

                // Verify signature — fail-closed if secret not configured
                const rcSecret = REVENUCAT_WEBHOOK_SECRET.value();
                if (!rcSecret) {
                    logger.error("❌ REVENUCAT_WEBHOOK_SECRET not configured — rejecting");
                    res.status(500).send("Server misconfigured");
                    return;
                }
                if (!verifyRevenueCatSignature(rawBody, sig, rcSecret)) {
                    logger.error("❌ RevenueCat signature verification failed");
                    res.status(403).send("Invalid signature");
                    return;
                }

                await handleRevenueCatWebhook(req.body);
            } else {
                logger.warn("⚠️ Unknown webhook payload format");
                res.status(400).send("Unknown webhook format");
                return;
            }

            res.status(200).send("OK");
        } catch (error: any) {
            logger.error("❌ Webhook processing failed:", error);
            res.status(500).send("Internal error");
        }
    }
);

// ═════════════════════════════════════════════════════════════════
//  PayHere Handler
// ═════════════════════════════════════════════════════════════════

async function handlePayHereWebhook(body: any): Promise<void> {
    const {
        merchant_id,
        order_id,
        payment_id,
        subscription_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig,
        custom_1,        // userId
        custom_2,        // subscription metadata
        recurring,
        item_rec_date_next,
    } = body;

    if (!PAYHERE_MERCHANT_ID.value() || !PAYHERE_MERCHANT_SECRET.value()) {
        logger.error("❌ PayHere merchant secrets are not configured");
        throw new Error("Server misconfigured");
    }

    if (merchant_id !== PAYHERE_MERCHANT_ID.value()) {
        logger.error("❌ PayHere merchant mismatch", { order_id });
        throw new Error("Invalid merchant");
    }

    // Verify signature
    const isValid = verifyPayHereSignature(
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        PAYHERE_MERCHANT_SECRET.value(),
        md5sig
    );

    if (!isValid) {
        logger.error("❌ PayHere signature verification failed", { order_id });
        throw new Error("Invalid PayHere signature");
    }

    // Idempotency: recurring renewals reuse order_id, so prefer payment_id.
    const idempotencyRef = db.doc(`webhook_events/payhere_${order_id}_${payment_id || subscription_id || status_code}`);
    const existing = await idempotencyRef.get();
    if (existing.exists) {
        logger.info(`⏭️ PayHere webhook already processed: ${order_id}`);
        return;
    }

    const userId = custom_1;
    const { profession, tier, planType, plan } = parsePlanMetadata(custom_2);

    if (!userId) {
        logger.error("❌ No userId in PayHere custom_1 field");
        throw new Error("Missing userId");
    }

    // Validate payment amount and currency
    const expectedAmountCents = amountCents(plan, planType);
    const receivedAmountCents = Math.round(parseFloat(payhere_amount) * 100);
    // Strict amount check: allow at most LKR 1 (100 cents) rounding difference.
    // (Previously 5% tolerance — exploitable as a systematic underpayment window.)
    if (receivedAmountCents < expectedAmountCents - 100) {
        logger.error(`❌ Amount mismatch: received ${receivedAmountCents}, expected ${expectedAmountCents}`);
        throw new Error("Payment amount mismatch");
    }
    if (payhere_currency !== "LKR") {
        logger.error(`❌ Unexpected currency: ${payhere_currency}`);
        throw new Error("Invalid currency");
    }

    logger.info(`💳 PayHere webhook: order=${order_id}, status=${status_code}, user=${userId}, plan=${profession}/${tier}/${planType}`);

    // PayHere status codes: 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargeback
    const statusMap: Record<string, string> = {
        "2": "active",
        "0": "pending",
        "-1": "canceled",
        "-2": "past_due",
        "-3": "canceled",
    };

    const newStatus = statusMap[status_code] || "unknown";
    const subRef = db.doc(`users/${userId}/subscription/current`);

    if (newStatus === "active") {
        await subRef.set({
            tier,
            status: "active",
            current_period_end: nextPeriodEnd(planType, item_rec_date_next),
            provider: "payhere_web",
            provider_subscription_id: subscription_id || order_id,
            provider_payment_id: payment_id || null,
            plan_type: planType,
            profession,
            amount_cents: expectedAmountCents,
            plan_label: plan.label,
            is_recurring: recurring === "1" || Boolean(subscription_id),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        await db.doc(`users/${userId}/payment_attempts/${order_id}`).set({
            status: "paid",
            payment_id: payment_id || null,
            subscription_id: subscription_id || null,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        logger.info(`✅ User ${userId} upgraded to ${tier} (PayHere, ${planType})`);
    } else if (newStatus === "canceled" || newStatus === "past_due") {
        await subRef.set({
            status: newStatus,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await db.doc(`users/${userId}/payment_attempts/${order_id}`).set({
            status: newStatus,
            payment_id: payment_id || null,
            subscription_id: subscription_id || null,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        logger.info(`⚠️ User ${userId} subscription ${newStatus} (PayHere)`);
    }

    // Mark as processed for idempotency
    await idempotencyRef.set({
        processed_at: admin.firestore.FieldValue.serverTimestamp(),
        status_code,
        userId,
        order_id,
        payment_id: payment_id || null,
        subscription_id: subscription_id || null,
        profession,
        tier,
        plan_type: planType,
    });
}

// ═════════════════════════════════════════════════════════════════
//  RevenueCat Handler
// ═════════════════════════════════════════════════════════════════

async function handleRevenueCatWebhook(body: any): Promise<void> {
    const event = body.event;
    if (!event) {
        logger.warn("⚠️ RevenueCat webhook missing event");
        return;
    }

    const {
        type,
        app_user_id,
        expiration_at_ms,
        product_id,
        store,
    } = event;

    const userId = app_user_id;

    if (!userId || userId.startsWith("$RCAnonymousID")) {
        logger.warn("⚠️ RevenueCat event for anonymous user, skipping");
        return;
    }

    // Idempotency check
    const eventKey = `revenuecat_${event.id || `${app_user_id}_${type}_${Date.now()}`}`;
    const idempotencyRef = db.doc(`webhook_events/${eventKey}`);
    const existing = await idempotencyRef.get();
    if (existing.exists) {
        logger.info(`⏭️ RevenueCat event already processed: ${eventKey}`);
        return;
    }

    logger.info(`🍎 RevenueCat webhook: type=${type}, user=${userId}, product=${product_id}`);

    const subRef = db.doc(`users/${userId}/subscription/current`);

    // Determine plan from product_id
    const isAnnual = product_id?.includes("annual") || product_id?.includes("yearly");
    const planType: BillingPeriod = isAnnual ? "annual" : "monthly";
    const plan = getSubscriptionPlan("individual", "pro");

    switch (type) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "PRODUCT_CHANGE":
        case "UNCANCELLATION": {
            const periodEnd = expiration_at_ms
                ? new Date(expiration_at_ms)
                : new Date(Date.now() + periodDays(planType) * 86400000);

            await subRef.set({
                tier: "pro",
                status: "active",
                current_period_end: admin.firestore.Timestamp.fromDate(periodEnd),
                provider: store === "APP_STORE" ? "apple_app_store" : "google_play",
                provider_subscription_id: event.id || product_id,
                plan_type: planType,
                amount_cents: amountCents(plan, planType),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info(`✅ User ${userId} Pro activated (RevenueCat ${type})`);
            break;
        }

        case "CANCELLATION":
        case "EXPIRATION": {
            await subRef.update({
                status: "canceled",
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info(`⚠️ User ${userId} subscription ${type}`);
            break;
        }

        case "BILLING_ISSUE": {
            await subRef.update({
                status: "past_due",
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info(`⚠️ User ${userId} billing issue`);
            break;
        }

        default:
            logger.info(`ℹ️ Unhandled RevenueCat event type: ${type}`);
    }

    // Mark as processed
    await idempotencyRef.set({
        processed_at: admin.firestore.FieldValue.serverTimestamp(),
        type,
        userId,
    });
}
