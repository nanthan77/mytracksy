import * as functions from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import { requireRole } from './adminRoles';

const db = getFirestore();

type SubscriptionSummary = {
  tier: string;
  status: string;
  amount_cents: number;
  plan_type?: string;
};

async function getCurrentSubscription(userId: string): Promise<SubscriptionSummary> {
  const snap = await db.doc(`users/${userId}/subscription/current`).get();
  const data = snap.exists ? snap.data() || {} : {};
  return {
    tier: typeof data.tier === 'string' ? data.tier : 'free',
    status: typeof data.status === 'string' ? data.status : 'inactive',
    amount_cents: typeof data.amount_cents === 'number' ? data.amount_cents : 0,
    plan_type: typeof data.plan_type === 'string' ? data.plan_type : undefined,
  };
}

function isPaidSubscription(sub: SubscriptionSummary): boolean {
  return sub.status === 'active' && ['pro', 'chambers', 'lifetime'].includes(sub.tier);
}

function monthlyRevenueCents(sub: SubscriptionSummary): number {
  if (!isPaidSubscription(sub)) return 0;
  if (!sub.amount_cents || sub.plan_type === 'lifetime') return 0;
  return sub.plan_type === 'annual' ? Math.round(sub.amount_cents / 12) : sub.amount_cents;
}

// ─── Get stats for a specific profession ────────────────────────
export const getProfessionStats = functions.region('asia-south1').https.onCall(
  async (data: { profession: string }, context) => {
    const caller = await requireRole(context, ['super_admin', 'profession_admin', 'support_agent', 'viewer'], data.profession);

    const usersRef = db.collection('users');
    const professionQuery = usersRef.where('profession', '==', data.profession);

    const [totalSnap, activeSnap, pendingSnap, suspendedSnap] = await Promise.all([
      professionQuery.count().get(),
      professionQuery.where('status', '==', 'active').count().get(),
      professionQuery.where('status', '==', 'pending_verification').count().get(),
      professionQuery.where('status', '==', 'suspended').count().get(),
    ]);

    let proCount = 0;
    let mrrCents = 0;
    let aiUsageTotal = 0;

    const activeUsers = await usersRef
      .where('profession', '==', data.profession)
      .where('status', '==', 'active')
      .get();

    await Promise.all(activeUsers.docs.map(async (userDoc) => {
      const [sub, quotaSnap] = await Promise.all([
        getCurrentSubscription(userDoc.id),
        db.doc(`users/${userDoc.id}/usage_quotas/current_month`).get(),
      ]);

      if (isPaidSubscription(sub)) proCount++;
      mrrCents += monthlyRevenueCents(sub);
      aiUsageTotal += quotaSnap.exists ? quotaSnap.data()?.ai_voice_notes_used || 0 : 0;
    }));

    return {
      total_users: totalSnap.data().count,
      active_users: activeSnap.data().count,
      pending_users: pendingSnap.data().count,
      suspended_users: suspendedSnap.data().count,
      pro_users: proCount,
      free_users: (activeSnap.data().count) - proCount,
      mrr_cents: mrrCents,
      ai_voice_notes_total: aiUsageTotal,
      estimated_ai_cost_usd: aiUsageTotal * 0.012,
    };
  }
);

// ─── Get global stats across all professions ────────────────────
export const getGlobalStats = functions.region('asia-south1').https.onCall(
  async (_data, context) => {
    await requireRole(context, ['super_admin']);

    const usersRef = db.collection('users');

    const [totalSnap, activeSnap] = await Promise.all([
      usersRef.count().get(),
      usersRef.where('status', '==', 'active').count().get(),
    ]);

    // Get per-profession counts
    const allUsersSnap = await usersRef.get();
    const professionCounts: Record<string, { total: number; active: number; pro: number; mrr: number }> = {};

    const subscriptions = await Promise.all(
      allUsersSnap.docs.map(doc => getCurrentSubscription(doc.id))
    );

    allUsersSnap.docs.forEach((doc, index) => {
      const data = doc.data();
      const prof = data.profession || 'individual';
      if (!professionCounts[prof]) {
        professionCounts[prof] = { total: 0, active: 0, pro: 0, mrr: 0 };
      }
      professionCounts[prof].total++;
      if (data.status === 'active') {
        professionCounts[prof].active++;
        const sub = subscriptions[index];
        if (isPaidSubscription(sub)) {
          professionCounts[prof].pro++;
          professionCounts[prof].mrr += monthlyRevenueCents(sub);
        }
      }
    });

    const totalMrr = Object.values(professionCounts).reduce((sum, p) => sum + p.mrr, 0);

    return {
      total_users: totalSnap.data().count,
      active_users: activeSnap.data().count,
      total_mrr_cents: totalMrr,
      profession_breakdown: professionCounts,
    };
  }
);

// ─── Get paginated user list for a profession ───────────────────
export const getProfessionUsers = functions.region('asia-south1').https.onCall(
  async (data: { profession: string; status?: string; limit?: number; startAfter?: string }, context) => {
    const caller = await requireRole(context, ['super_admin', 'profession_admin', 'support_agent'], data.profession);

    let query = db.collection('users')
      .where('profession', '==', data.profession)
      .orderBy('created_at', 'desc')
      .limit(data.limit || 25);

    if (data.status) {
      query = query.where('status', '==', data.status);
    }

    if (data.startAfter) {
      const lastDoc = await db.collection('users').doc(data.startAfter).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snap = await query.get();
    const users = await Promise.all(snap.docs.map(async doc => {
      const userData = doc.data();
      const sub = await getCurrentSubscription(doc.id);
      return {
        uid: doc.id,
        email: userData.email,
        name: userData.name || userData.displayName || '',
        status: userData.status || 'active',
        profession: userData.profession,
        verification_id:
          userData.slmc_number ||
          userData.bar_registration ||
          userData.business_reg ||
          userData.company_reg ||
          userData.sltda_license ||
          userData.naqda_license ||
          userData.nic_number ||
          userData.verification_id ||
          '',
        subscription_tier: isPaidSubscription(sub) ? (sub.plan_type === 'lifetime' ? 'lifetime' : sub.tier) : 'free',
        subscription_status: sub.status,
        created_at: userData.created_at?.toDate?.()?.toISOString?.() || null,
      };
    }));

    return {
      users,
      hasMore: snap.docs.length === (data.limit || 25),
      lastDocId: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null,
    };
  }
);

// ─── Get audit log (filterable) ─────────────────────────────────
export const getAuditLog = functions.region('asia-south1').https.onCall(
  async (data: { profession?: string; action?: string; limit?: number }, context) => {
    const caller = await requireRole(context, ['super_admin', 'profession_admin', 'support_agent', 'viewer'],
      data.profession);

    let query = db.collection('admin_audit_log')
      .orderBy('timestamp', 'desc')
      .limit(data.limit || 50);

    if (data.profession && caller.role !== 'super_admin') {
      query = query.where('profession', '==', data.profession);
    }

    if (data.action) {
      query = query.where('action', '==', data.action);
    }

    const snap = await query.get();
    const entries = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { entries };
  }
);
