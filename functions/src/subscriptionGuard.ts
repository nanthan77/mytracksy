/**
 * subscriptionGuard.ts — Feature Gating & Quota Enforcer
 *
 * Reusable utility for Cloud Functions to enforce Pro/Free tier limits.
 *
 * Logic:
 *   1. If tier == "pro" && status == "active" → allow
 *   2. If tier == "free" → check usage_quotas/current_month
 *   3. If ai_voice_notes_used >= FREE_QUOTA → throw resource-exhausted
 *   4. Under limit → increment(1) in transaction → return true
 */

import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

const db = admin.firestore();

// ─── Constants ──────────────────────────────────────────────────
const FREE_VOICE_NOTE_QUOTA = 5;

export interface SubscriptionData {
    tier: "free" | "pro";
    status: "active" | "past_due" | "canceled" | "trialing";
    current_period_end?: admin.firestore.Timestamp;
    provider?: string;
    provider_subscription_id?: string;
}

export interface UsageQuota {
    month_id: string;
    ai_voice_notes_used: number;
    [counter: string]: string | number | undefined;
}

/** Per-feature quota configuration for the generic guard. */
export interface QuotaOptions {
    /** Firestore counter field in usage_quotas/current_month (default: ai_voice_notes_used) */
    quotaField?: string;
    /** Free-tier monthly allowance for this feature (default: FREE_VOICE_NOTE_QUOTA) */
    freeQuota?: number;
}

// ─── Helper: get current month ID ───────────────────────────────
function getCurrentMonthId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}_${month}`;
}

// ─── Main Guard Function ────────────────────────────────────────

/**
 * Verifies if a user has Pro access or is within their free quota.
 * If free and under quota, atomically increments the usage counter.
 *
 * @param userId - The Firebase Auth UID
 * @param feature - The feature being accessed (for logging)
 * @returns { allowed: true, tier } on success
 * @throws HttpsError if quota exceeded
 */
export async function verifyProOrCheckQuota(
    userId: string,
    feature: string = "ai_voice_note",
    options: QuotaOptions = {}
): Promise<{ allowed: boolean; tier: string; remaining?: number }> {
    const quotaField = options.quotaField ?? "ai_voice_notes_used";
    const freeQuota = options.freeQuota ?? FREE_VOICE_NOTE_QUOTA;
    const subRef = db.doc(`users/${userId}/subscription/current`);
    const subSnap = await subRef.get();

    // ── Check Pro status ──
    if (subSnap.exists) {
        const sub = subSnap.data() as SubscriptionData;

        if (sub.tier === "pro" && sub.status === "active") {
            // Check if subscription hasn't expired
            if (sub.current_period_end) {
                const endDate = sub.current_period_end.toDate();
                if (endDate > new Date()) {
                    logger.info(`✅ Pro user ${userId} — unlimited ${feature}`);
                    return { allowed: true, tier: "pro" };
                }
                // Expired — fall through to free tier check
                logger.warn(`⚠️ User ${userId} Pro subscription expired on ${endDate.toISOString()}`);
            } else {
                // No end date set (e.g. demo) — allow
                logger.info(`✅ Pro user ${userId} (no expiry) — unlimited ${feature}`);
                return { allowed: true, tier: "pro" };
            }
        }
    }

    // ── Free tier: check quota via transaction ──
    const monthId = getCurrentMonthId();
    const quotaRef = db.doc(`users/${userId}/usage_quotas/current_month`);

    return db.runTransaction(async (tx) => {
        const quotaSnap = await tx.get(quotaRef);
        let used = 0;

        if (quotaSnap.exists) {
            const data = quotaSnap.data() as UsageQuota;

            // If it's a new month, reset ALL counters (doc is replaced)
            if (data.month_id !== monthId) {
                tx.set(quotaRef, {
                    month_id: monthId,
                    [quotaField]: 1,
                });
                logger.info(`🔄 New month ${monthId} — reset quota for ${userId}, using 1/${freeQuota} ${feature}`);
                return { allowed: true, tier: "free", remaining: freeQuota - 1 };
            }

            used = (data[quotaField] as number) || 0;
        }

        // Check if over limit
        if (used >= freeQuota) {
            logger.warn(`🚫 User ${userId} hit free quota: ${used}/${freeQuota} ${feature}`);
            throw new HttpsError(
                "resource-exhausted",
                `Monthly free limit reached for this feature (${freeQuota}/${freeQuota} used). Upgrade to Pro for unlimited access.`
            );
        }

        // Under limit — increment
        if (quotaSnap.exists) {
            tx.update(quotaRef, {
                [quotaField]: admin.firestore.FieldValue.increment(1),
            });
        } else {
            // First usage ever — create the document
            tx.set(quotaRef, {
                month_id: monthId,
                [quotaField]: 1,
            });
        }

        const remaining = freeQuota - used - 1;
        logger.info(`📊 Free user ${userId}: ${used + 1}/${freeQuota} ${feature} used (${remaining} remaining)`);
        return { allowed: true, tier: "free", remaining };
    });
}

/**
 * Strict Pro gate — no free quota. Throws unless the user has an active,
 * unexpired Pro subscription. Use for Pro-exclusive compute.
 */
export async function requirePro(userId: string, feature: string): Promise<void> {
    if (await isProUser(userId)) return;
    logger.warn(`🚫 ${feature}: user ${userId} is not Pro`);
    throw new HttpsError(
        "permission-denied",
        `${feature} requires an active Pro subscription. Upgrade to continue.`
    );
}

// ─── Canonical AI-token wallet ──────────────────────────────────
// The ONE wallet location: users/{uid}/wallet/current_balance, field
// `ai_tokens`. PayHere top-ups credit it, spendTokens debits it, and
// useTokenWallet renders it. (Profession AI functions previously read
// `wallet/balance.tokens` or `users/{uid}.token_balance` — paths that are
// never credited, so paying users were always rejected.)

/**
 * Atomically spend AI tokens from the canonical wallet. Throws
 * resource-exhausted if the balance is insufficient. Logs the spend.
 */
export async function spendWalletTokens(
    userId: string,
    cost: number,
    feature: string
): Promise<{ remaining: number }> {
    if (!Number.isInteger(cost) || cost <= 0) {
        throw new HttpsError("invalid-argument", "Invalid token cost");
    }
    const walletRef = db.doc(`users/${userId}/wallet/current_balance`);
    return db.runTransaction(async (tx) => {
        const snap = await tx.get(walletRef);
        const current = snap.exists ? (snap.data()?.ai_tokens || 0) : 0;
        if (current < cost) {
            throw new HttpsError(
                "resource-exhausted",
                `Insufficient tokens. Need ${cost}, have ${current}. Please top up.`
            );
        }
        tx.set(walletRef, {
            ai_tokens: current - cost,
            last_spent_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        const logRef = db.collection(`users/${userId}/wallet_transactions`).doc();
        tx.set(logRef, {
            type: "spend",
            tokens: -cost,
            feature,
            createdAt: Date.now(),
        });
        logger.info(`🪙 ${userId} spent ${cost} tokens on ${feature} (${current - cost} left)`);
        return { remaining: current - cost };
    });
}

/**
 * Refund tokens after a failed AI call (spend-first, refund-on-error pattern
 * so users are never charged for failures).
 */
export async function refundWalletTokens(userId: string, cost: number, feature: string): Promise<void> {
    const walletRef = db.doc(`users/${userId}/wallet/current_balance`);
    await walletRef.set({ ai_tokens: admin.firestore.FieldValue.increment(cost) }, { merge: true });
    await db.collection(`users/${userId}/wallet_transactions`).add({
        type: "refund",
        tokens: cost,
        feature,
        createdAt: Date.now(),
    });
    logger.info(`↩️ Refunded ${cost} tokens to ${userId} (${feature} failed)`);
}

/**
 * Quick check: is user on Pro tier? (No quota increment)
 */
export async function isProUser(userId: string): Promise<boolean> {
    const subSnap = await db.doc(`users/${userId}/subscription/current`).get();
    if (!subSnap.exists) return false;
    const sub = subSnap.data() as SubscriptionData;
    if (sub.tier !== "pro" || sub.status !== "active") return false;
    if (sub.current_period_end) {
        return sub.current_period_end.toDate() > new Date();
    }
    return true;
}

/**
 * Get usage stats for a user (for frontend display)
 */
export async function getUsageStats(userId: string): Promise<{
    tier: string;
    status: string;
    voiceNotesUsed: number;
    voiceNotesLimit: number;
    currentPeriodEnd?: Date;
}> {
    const subSnap = await db.doc(`users/${userId}/subscription/current`).get();
    const quotaSnap = await db.doc(`users/${userId}/usage_quotas/current_month`).get();

    const sub = subSnap.exists ? subSnap.data() as SubscriptionData : { tier: "free" as const, status: "active" as const };
    const quota = quotaSnap.exists ? quotaSnap.data() as UsageQuota : { month_id: getCurrentMonthId(), ai_voice_notes_used: 0 };

    // Reset count if it's a new month
    const monthId = getCurrentMonthId();
    const used = quota.month_id === monthId ? quota.ai_voice_notes_used : 0;

    return {
        tier: sub.tier,
        status: sub.status,
        voiceNotesUsed: sub.tier === "pro" ? 0 : used,
        voiceNotesLimit: sub.tier === "pro" ? -1 : FREE_VOICE_NOTE_QUOTA,
        currentPeriodEnd: sub.current_period_end?.toDate(),
    };
}
