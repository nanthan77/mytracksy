import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized (since this is imported into index.ts)
const db = admin.firestore();

// ============================================
// 1. The Multi-Currency Transaction Engine
// ============================================
export const logTourTransaction = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const userId = request.auth.uid;
    const { tripId, type, amount, currency, exchangeRateToLKR, category, paidBy } = request.data;

    if (!tripId || !amount || !currency || !exchangeRateToLKR) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required transaction fields');
    }

    // Strict string validation for 'type'
    if (type !== 'income' && type !== 'expense') {
        throw new functions.https.HttpsError('invalid-argument', 'type must be \'income\' or \'expense\'');
    }

    // Calculate LKR Taxable value
    const lkrValue = amount * exchangeRateToLKR;

    return db.runTransaction(async (txn) => {
        // 1. Update the specific currency wallet
        const walletRef = db.doc(`users/${userId}/wallets/${currency}`);
        const walletSnap = await txn.get(walletRef);
        const currentBalance = walletSnap.exists ? (walletSnap.data()?.balance_cents || 0) : 0;

        // amount in payload expected to be raw cents
        const delta = type === 'income' ? amount : -amount;

        txn.set(walletRef, {
            currency,
            balance_cents: currentBalance + delta,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 2. Log exactly to the trip
        const expenseRef = db.collection(`users/${userId}/trips/${tripId}/transactions`).doc();

        txn.set(expenseRef, {
            type,
            amount_cents: amount,
            currency,
            exchangeRateToLKR,
            lkr_value_cents: lkrValue,
            category: category || 'Uncategorized',
            paid_by: paidBy || 'out_of_pocket', // 'out_of_pocket' | 'agency_advance'
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. Update trip totals
        const tripRef = db.doc(`users/${userId}/trips/${tripId}`);
        const tripSnap = await txn.get(tripRef);

        let totalRevenueUsd = tripSnap.exists ? (tripSnap.data()?.total_revenue_usd_cents || 0) : 0;

        if (type === 'income' && currency === 'USD') {
            txn.set(tripRef, {
                total_revenue_usd_cents: totalRevenueUsd + amount,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        // 4. Global Ledger
        const globalLedgerRef = db.collection(`users/${userId}/transactions`).doc();
        txn.set(globalLedgerRef, {
            trip_id: tripId,
            type,
            original_amount_cents: amount,
            original_currency: currency,
            lkr_value_cents: lkrValue,
            category,
            tag: 'tour_tracking',
            createdAt: Date.now(),
            sync_status: 'synced',
        });

        return { success: true, lkrValueCalculated: lkrValue };
    });
});

// ============================================
// 2. The Agent/Tuk-Tuk Commission Tracker
// ============================================
export const logActivityBooking = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const userId = request.auth.uid;
    const { paxCount, totalRevenueLKR, referrerId, commissionPerPaxLKR } = request.data;

    if (!paxCount || paxCount <= 0 || !totalRevenueLKR || !referrerId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing paxCount, revenue, or referrer');
    }

    const totalCommission = paxCount * (commissionPerPaxLKR || 0);

    return db.runTransaction(async (txn) => {
        // 1. Log overall income
        const incomeRef = db.collection(`users/${userId}/transactions`).doc();
        txn.set(incomeRef, {
            type: 'income',
            amount_cents: totalRevenueLKR,
            category: 'Activity Revenue',
            referrer_id: referrerId,
            pax_count: paxCount,
            createdAt: Date.now(),
            sync_status: 'synced',
        });

        // 2. Double Entry for pending commissions if applicable
        if (totalCommission > 0) {
            const referrerRef = db.doc(`users/${userId}/referrers/${referrerId}`);
            const referrerSnap = await txn.get(referrerRef);

            const currentPending = referrerSnap.exists ? (referrerSnap.data()?.pending_commission_cents || 0) : 0;

            txn.set(referrerRef, {
                pending_commission_cents: currentPending + totalCommission,
                lastActive: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            const commissionLogRef = db.collection(`users/${userId}/referrers/${referrerId}/commission_logs`).doc();
            txn.set(commissionLogRef, {
                type: 'accrued',
                amount_cents: totalCommission,
                from_pax_count: paxCount,
                createdAt: Date.now(),
            });
        }

        return {
            success: true,
            revenueLogged: totalRevenueLKR,
            commissionAdded: totalCommission
        };
    });
});
