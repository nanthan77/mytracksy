import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { requireRole } from './adminRoles';

const db = getFirestore();

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

    // Pro users and MRR
    const proSnap = await usersRef
      .where('profession', '==', data.profession)
      .where('status', '==', 'active')
      .get();

    let proCount = 0;
    let mrrCents = 0;
    let aiUsageTotal = 0;

    proSnap.docs.forEach(doc => {
      const userData = doc.data();
      const sub = userData.subscription;
      if (sub && (sub.tier === 'pro' || sub.tier === 'lifetime')) {
        proCount++;
        if (sub.tier === 'pro' && sub.amount_cents) {
          mrrCents += sub.amount_cents;
        }
      }
      if (userData.usage_quotas?.ai_voice_notes_used) {
        aiUsageTotal += userData.usage_quotas.ai_voice_notes_used;
      }
    });

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

    allUsersSnap.docs.forEach(doc => {
      const data = doc.data();
      const prof = data.profession || 'individual';
      if (!professionCounts[prof]) {
        professionCounts[prof] = { total: 0, active: 0, pro: 0, mrr: 0 };
      }
      professionCounts[prof].total++;
      if (data.status === 'active') {
        professionCounts[prof].active++;
        const sub = data.subscription;
        if (sub && (sub.tier === 'pro' || sub.tier === 'lifetime')) {
          professionCounts[prof].pro++;
          if (sub.tier === 'pro' && sub.amount_cents) {
            professionCounts[prof].mrr += sub.amount_cents;
          }
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
    const users = snap.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      status: doc.data().status,
      profession: doc.data().profession,
      verification_id: doc.data().slmc_number || doc.data().verification_id || '',
      subscription_tier: doc.data().subscription?.tier || 'free',
      created_at: doc.data().created_at?.toDate?.() || null,
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
