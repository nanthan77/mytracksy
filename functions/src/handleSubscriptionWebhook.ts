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
const PAYHERE_MERCHANT_SECRET = defineSecret("PAYHERE_MERCHANT_SECRET");
const REVENUCAT_WEBHOOK_SECRET = defineSecret("REVENUCAT_WEBHOOK_SECRET");

// ─── Pricing ────────────────────────────────────────────────────
const PLAN_PRICES: Record<string, { amount_cents: number; period_days: number; label: string }> = {
    monthly: { amount_cents: 290000, period_days: 30, label: "Monthly Pro" },
    annual: { amount_cents: 2500000, period_days: 365, label: "Annual Pro" },
};

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
        secrets: [PAYHERE_MERCHANT_SECRET, REVENUCAT_WEBHOOK_SECRET],
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
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig,
        custom_1,        // userId
        custom_2,        // plan: "monthly" | "annual"
        recurring,
    } = body;

    // Idempotency: skip if already processed
    const idempotencyRef = db.doc(`webhook_events/payhere_${order_id}_${status_code}`);
    const existing = await idempotencyRef.get();
    if (existing.exists) {
        logger.info(`⏭️ PayHere webhook already processed: ${order_id}`);
        return;
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

    const userId = custom_1;
    const planType = (custom_2 || "monthly") as string;

    if (!userId) {
        logger.error("❌ No userId in PayHere custom_1 field");
        throw new Error("Missing userId");
    }

    // Validate payment amount and currency
    const expectedPlan = PLAN_PRICES[planType] || PLAN_PRICES.monthly;
    const receivedAmountCents = Math.round(parseFloat(payhere_amount) * 100);
    if (receivedAmountCents < expectedPlan.amount_cents * 0.95) {
        logger.error(`❌ Amount mismatch: received ${receivedAmountCents}, expected ${expectedPlan.amount_cents}`);
        throw new Error("Payment amount mismatch");
    }
    if (payhere_currency !== "LKR") {
        logger.error(`❌ Unexpected currency: ${payhere_currency}`);
        throw new Error("Invalid currency");
    }

    logger.info(`💳 PayHere webhook: order=${order_id}, status=${status_code}, user=${userId}, plan=${planType}`);

    // PayHere status codes: 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargeback
    const statusMap: Record<string, string> = {
        "2": "active",
        "0": "pending",
        "-1": "canceled",
        "-2": "past_due",
        "-3": "canceled",
    };

    const newStatus = statusMap[status_code] || "unknown";
    const plan = PLAN_PRICES[planType] || PLAN_PRICES.monthly;

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + plan.period_days);

    const subRef = db.doc(`users/${userId}/subscription/current`);

    if (newStatus === "active") {
        await subRef.set({
            tier: "pro",
            status: "active",
            current_period_end: admin.firestore.Timestamp.fromDate(periodEnd),
            provider: "payhere_web",
            provider_subscription_id: order_id,
            plan_type: planType,
            amount_cents: plan.amount_cents,
            is_recurring: recurring === "1",
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`✅ User ${userId} upgraded to Pro (PayHere, ${planType})`);
    } else if (newStatus === "canceled" || newStatus === "past_due") {
        await subRef.update({
            status: newStatus,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`⚠️ User ${userId} subscription ${newStatus} (PayHere)`);
    }

    // Mark as processed for idempotency
    await idempotencyRef.set({
        processed_at: admin.firestore.FieldValue.serverTimestamp(),
        status_code,
        userId,
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
    const planType = isAnnual ? "annual" : "monthly";
    const plan = PLAN_PRICES[planType];

    switch (type) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "PRODUCT_CHANGE":
        case "UNCANCELLATION": {
            const periodEnd = expiration_at_ms
                ? new Date(expiration_at_ms)
                : new Date(Date.now() + plan.period_days * 86400000);

            await subRef.set({
                tier: "pro",
                status: "active",
                current_period_end: admin.firestore.Timestamp.fromDate(periodEnd),
                provider: store === "APP_STORE" ? "apple_app_store" : "google_play",
                provider_subscription_id: event.id || product_id,
                plan_type: planType,
                amount_cents: plan.amount_cents,
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
