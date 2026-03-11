# Admin Panel Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate the admin panel to `admin.mytracksy.lk` with 4-tier roles, 12-profession tiles, per-profession admin panels, and high security.

**Architecture:** Monorepo with a second Vite entry point (`src-admin/main.tsx`) building to `build-admin/`. Firebase multi-site hosting serves `mytracksy.lk` from `build/` and `admin.mytracksy.lk` from `build-admin/`. Shared types and Firebase config live in `shared/`. Cloud Functions enhanced with role-based middleware.

**Tech Stack:** React 18, TypeScript, MUI 5, React Router 6, Recharts, Firebase (Auth + Firestore + Functions + Hosting), Vite 5

**Design Doc:** `docs/plans/2026-03-11-admin-panel-redesign-design.md`

---

## Phase 1: Foundation — Build Pipeline & Shared Types

### Task 1: Create shared types and constants

**Files:**
- Create: `shared/types/admin.ts`
- Create: `shared/types/profession.ts`
- Create: `shared/types/user.ts`
- Create: `shared/constants/professions.ts`
- Create: `shared/firebase/config.ts`

**Step 1: Create `shared/types/admin.ts`**

```typescript
export type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

export interface AdminUser {
  uid: string;
  role: AdminRole;
  professions: string[]; // profession IDs this admin can access
  email: string;
  display_name: string;
  created_by: string;
  created_at: Date;
  last_login: Date | null;
  last_login_ip: string | null;
  allowed_ips: string[];
  session_timeout_minutes: number;
  status: 'active' | 'disabled';
}

export interface AdminSession {
  last_activity: Date;
  ip_address: string;
  user_agent: string;
  expires_at: Date;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  target_user: string;
  performed_by: string;
  profession: string;
  ip_address: string;
  role: AdminRole;
  reason?: string;
  new_tier?: string;
  timestamp: Date;
}

export interface AdminConfig {
  session_timeout_minutes: number;
  maintenance_mode: boolean;
  rate_limit_per_minute: number;
}

// Permission matrix
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'override_subscriptions', 'manage_settings', 'manage_roles',
    'view_analytics', 'send_notifications', 'manage_tax_engine',
    'view_audit_log', 'manage_ai_usage'
  ],
  profession_admin: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'override_subscriptions', 'manage_settings', 'view_analytics',
    'send_notifications', 'view_audit_log'
  ],
  support_agent: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'view_audit_log'
  ],
  viewer: [
    'view_dashboard', 'view_analytics'
  ]
};
```

**Step 2: Create `shared/types/profession.ts`**

```typescript
export interface ProfessionConfig {
  id: string;
  label: string;
  icon: string;
  route: string;         // URL slug used in main app
  verificationField: string;
  verificationLabel: string;
  color: string;         // theme color for the tile
}
```

**Step 3: Create `shared/types/user.ts`**

```typescript
export type UserStatus = 'active' | 'pending_verification' | 'suspended';
export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  profession: string;
  status: UserStatus;
  created_at: Date;
  verification_id?: string;  // SLMC, Bar #, etc.
  hospital?: string;         // or "company", "organization"
  subscription: {
    tier: SubscriptionTier;
    status: string;
    provider: string;
    current_period_end?: Date;
    amount_cents?: number;
  };
  usage_quotas?: {
    ai_voice_notes_used: number;
  };
}
```

**Step 4: Create `shared/constants/professions.ts`**

```typescript
import { ProfessionConfig } from '../types/profession';

export const PROFESSIONS: ProfessionConfig[] = [
  { id: 'medical',      label: 'Medical',      icon: '🩺', route: '/dr',        verificationField: 'slmc_number',       verificationLabel: 'SLMC Number',          color: '#E53E3E' },
  { id: 'legal',        label: 'Legal',        icon: '⚖️', route: '/lawyer',    verificationField: 'bar_registration',  verificationLabel: 'Bar Registration',     color: '#3182CE' },
  { id: 'business',     label: 'Business',     icon: '📈', route: '/biz',       verificationField: 'business_reg',      verificationLabel: 'Business Registration',color: '#38A169' },
  { id: 'engineering',  label: 'Engineering',  icon: '⚙️', route: '/engineer',  verificationField: 'iesl_membership',   verificationLabel: 'IESL Membership',      color: '#DD6B20' },
  { id: 'trading',      label: 'Trading',      icon: '📊', route: '/trader',    verificationField: 'trading_license',   verificationLabel: 'Trading License',      color: '#805AD5' },
  { id: 'automotive',   label: 'Automotive',   icon: '🚗', route: '/auto',      verificationField: 'business_reg',      verificationLabel: 'Business Registration',color: '#D53F8C' },
  { id: 'marketing',    label: 'Marketing',    icon: '📢', route: '/marketing', verificationField: 'company_reg',       verificationLabel: 'Company Registration', color: '#00B5D8' },
  { id: 'travel',       label: 'Travel',       icon: '✈️', route: '/travel',    verificationField: 'sltda_license',     verificationLabel: 'SLTDA License',        color: '#319795' },
  { id: 'transport',    label: 'Transport',    icon: '🚛', route: '/transport', verificationField: 'transport_license', verificationLabel: 'Transport License',    color: '#975A16' },
  { id: 'retail',       label: 'Retail',       icon: '🛒', route: '/retail',    verificationField: 'business_reg',      verificationLabel: 'Business Registration',color: '#E53E3E' },
  { id: 'aquaculture',  label: 'Aquaculture',  icon: '🐟', route: '/aqua',      verificationField: 'naqda_license',     verificationLabel: 'NAQDA License',        color: '#2B6CB0' },
  { id: 'individual',   label: 'Individual',   icon: '👤', route: '/personal',  verificationField: 'nic_number',        verificationLabel: 'NIC Number',           color: '#718096' },
];

export const PROFESSION_MAP = Object.fromEntries(
  PROFESSIONS.map(p => [p.id, p])
);
```

**Step 5: Create `shared/firebase/config.ts`**

Extract the Firebase config from the main app. Read `src/firebaseConfig.ts` (or wherever it currently lives) and copy the config object here so both apps share it.

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  // Copy exact config from existing src/firebaseConfig.ts
  apiKey: "...",
  authDomain: "...",
  projectId: "tracksy-8e30c",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-south1');
export { app };
```

**Step 6: Commit**

```bash
git add shared/
git commit -m "feat: add shared types, constants, and Firebase config for admin panel"
```

---

### Task 2: Create Vite admin build config and entry HTML

**Files:**
- Create: `admin.html`
- Create: `vite.admin.config.ts`
- Modify: `package.json` (scripts section)
- Modify: `tsconfig.json` (include array)

**Step 1: Create `admin.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="MyTracksy Admin Panel" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <title>MyTracksy Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src-admin/main.tsx"></script>
  </body>
</html>
```

Note: `<meta name="robots" content="noindex, nofollow" />` prevents search engines from indexing the admin panel.

**Step 2: Create `vite.admin.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@admin': path.resolve(__dirname, 'src-admin'),
    },
  },
  build: {
    outDir: 'build-admin',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'admin.html'),
      output: {
        entryFileNames: 'admin.js',
        chunkFileNames: 'admin-[hash].js',
        assetFileNames: 'admin-[name].[ext]',
      },
    },
  },
  server: {
    port: 5174, // different port from main app (5173)
  },
});
```

**Step 3: Update `package.json` scripts**

Add these scripts alongside existing ones:

```json
"scripts": {
  "dev": "vite",
  "dev:admin": "vite --config vite.admin.config.ts",
  "build": "vite build",
  "build:admin": "vite build --config vite.admin.config.ts",
  "build:all": "npm run build && npm run build:admin",
  "deploy": "npm run build:all && firebase deploy",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "test": "vitest"
}
```

**Step 4: Update `tsconfig.json` include array**

Change line:
```json
"include": ["src"]
```
To:
```json
"include": ["src", "src-admin", "shared"]
```

**Step 5: Also add path aliases to `tsconfig.json` compilerOptions**

Add to compilerOptions:
```json
"paths": {
  "@shared/*": ["./shared/*"],
  "@admin/*": ["./src-admin/*"]
}
```

**Step 6: Commit**

```bash
git add admin.html vite.admin.config.ts package.json tsconfig.json
git commit -m "feat: add admin Vite build config, entry HTML, and build scripts"
```

---

### Task 3: Set up Firebase multi-site hosting

**Files:**
- Modify: `firebase.json`
- Modify: `.firebaserc`

**Step 1: Update `.firebaserc` to add hosting targets**

Replace the current content:

```json
{
  "projects": {
    "default": "tracksy-8e30c"
  },
  "targets": {
    "tracksy-8e30c": {
      "hosting": {
        "main": ["tracksy-8e30c"],
        "admin": ["mytracksy-admin"]
      }
    }
  }
}
```

Note: `mytracksy-admin` is the Firebase Hosting site ID for the admin panel. You'll need to create this site in Firebase Console: Hosting → Add another site → ID: `mytracksy-admin`.

**Step 2: Update `firebase.json` hosting to multi-site array**

Replace the single `"hosting": { ... }` object with an array of two hosting configs:

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "codebase": "default"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": [
    {
      "target": "main",
      "public": "build",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "headers": [
        {
          "source": "**/*.@(js|css|woff2|png|jpg|jpeg|svg|ico|gif)",
          "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
        },
        {
          "source": "**",
          "headers": [
            { "key": "X-Frame-Options", "value": "DENY" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
            { "key": "Permissions-Policy", "value": "camera=(self), microphone=(self), geolocation=(self)" },
            { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
            { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://api.openai.com; frame-src 'self' https://*.firebaseapp.com" }
          ]
        }
      ],
      "redirects": [{ "source": "/login", "destination": "/login.html", "type": 301 }],
      "rewrites": [
        { "source": "/dr", "destination": "/index.html" },
        { "source": "/lawyer", "destination": "/index.html" },
        { "source": "/engineer", "destination": "/index.html" },
        { "source": "/biz", "destination": "/index.html" },
        { "source": "/personal", "destination": "/index.html" },
        { "source": "/trader", "destination": "/index.html" },
        { "source": "/auto", "destination": "/index.html" },
        { "source": "/marketing", "destination": "/index.html" },
        { "source": "/travel", "destination": "/index.html" },
        { "source": "/transport", "destination": "/index.html" },
        { "source": "/retail", "destination": "/index.html" },
        { "source": "/aqua", "destination": "/index.html" },
        { "source": "**", "destination": "/index.html" }
      ]
    },
    {
      "target": "admin",
      "public": "build-admin",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "headers": [
        {
          "source": "**/*.@(js|css|woff2|png|jpg|jpeg|svg|ico|gif)",
          "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
        },
        {
          "source": "**",
          "headers": [
            { "key": "X-Frame-Options", "value": "DENY" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
            { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
            { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com; frame-src 'none'" },
            { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
          ]
        }
      ],
      "rewrites": [
        { "source": "**", "destination": "/admin.html" }
      ]
    }
  ]
}
```

Key differences for admin site:
- No OpenAI in CSP (admin doesn't use AI)
- `frame-src 'none'` (admin never iframes)
- `camera=(), microphone=(), geolocation=()` all disabled (admin doesn't need device access)

**Step 3: Remove `/admin` rewrite from main site** (already done above — no `/admin` rewrite in main hosting config)

**Step 4: Commit**

```bash
git add firebase.json .firebaserc
git commit -m "feat: configure Firebase multi-site hosting for admin.mytracksy.lk"
```

---

### Task 4: Remove admin routing from main app

**Files:**
- Modify: `src/App.tsx` (lines 12, 20-24)

**Step 1: Remove AdminApp import (line 12)**

Delete this line:
```typescript
import AdminApp from './admin/AdminApp';
```

**Step 2: Remove /admin path check (lines 20-24)**

Delete these lines:
```typescript
// ─── Admin Panel Route ─────────────────────────────────────────
// If URL starts with /admin, render the admin panel (completely separate UI)
if (window.location.pathname.startsWith('/admin')) {
  return <AdminApp />;
}
```

**Step 3: Verify main app still builds**

```bash
npm run build
```

Expected: Build succeeds, output in `build/`

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: remove admin panel routing from main app"
```

---

## Phase 2: Cloud Functions — Role-Based Auth & Actions

### Task 5: Create role-based admin middleware

**Files:**
- Create: `functions/src/adminRoles.ts`
- Modify: `functions/src/adminAuth.ts`

**Step 1: Create `functions/src/adminRoles.ts`**

```typescript
import * as functions from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();
const auth = getAuth();

const FOUNDER_UID = 'eyuHN6ZeYZgi2fSBM3bmslfzAhX2';

type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

// ─── Middleware: Verify role + profession access ────────────────
export async function requireRole(
  context: functions.https.CallableContext,
  requiredRoles: AdminRole[],
  requiredProfession?: string
): Promise<{ uid: string; role: AdminRole; professions: string[] }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const uid = context.auth.uid;
  const claims = context.auth.token;

  // Founder always has super_admin
  const role: AdminRole = uid === FOUNDER_UID ? 'super_admin' : (claims.admin_role as AdminRole);

  if (!role || !requiredRoles.includes(role)) {
    // Log failed access attempt
    await db.collection('admin_audit_log').add({
      action: 'access_denied',
      performed_by: uid,
      role: role || 'none',
      reason: `Required: ${requiredRoles.join(',')}`,
      ip_address: context.rawRequest?.ip || 'unknown',
      timestamp: FieldValue.serverTimestamp(),
    });
    throw new functions.https.HttpsError('permission-denied', 'Insufficient role');
  }

  const professions: string[] = uid === FOUNDER_UID
    ? ['all']
    : (claims.admin_professions as string[] || []);

  // Check profession access (super_admin can access all)
  if (requiredProfession && role !== 'super_admin') {
    if (!professions.includes(requiredProfession)) {
      throw new functions.https.HttpsError('permission-denied', 'No access to this profession');
    }
  }

  // Check IP allowlist
  const adminDoc = await db.collection('admin_users').doc(uid).get();
  if (adminDoc.exists) {
    const adminData = adminDoc.data()!;
    if (adminData.status === 'disabled') {
      throw new functions.https.HttpsError('permission-denied', 'Account disabled');
    }
    const allowedIps = adminData.allowed_ips || [];
    const requestIp = context.rawRequest?.ip || '';
    if (allowedIps.length > 0 && !allowedIps.includes(requestIp)) {
      await db.collection('admin_audit_log').add({
        action: 'ip_blocked',
        performed_by: uid,
        ip_address: requestIp,
        reason: `IP not in allowlist`,
        timestamp: FieldValue.serverTimestamp(),
      });
      throw new functions.https.HttpsError('permission-denied', 'IP not allowed');
    }
  }

  // Update session
  await db.collection('admin_sessions').doc(uid).set({
    last_activity: FieldValue.serverTimestamp(),
    ip_address: context.rawRequest?.ip || 'unknown',
    user_agent: context.rawRequest?.headers['user-agent'] || 'unknown',
    expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 min
  }, { merge: true });

  return { uid, role, professions };
}

// ─── Assign admin role to a user ────────────────────────────────
export const assignAdminRole = functions.region('asia-south1').https.onCall(
  async (data: { targetUid: string; role: AdminRole; professions: string[]; displayName: string }, context) => {
    const caller = await requireRole(context, ['super_admin']);

    const { targetUid, role, professions, displayName } = data;
    if (!targetUid || !role || !professions) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Set custom claims
    await auth.setCustomUserClaims(targetUid, {
      admin_role: role,
      admin_professions: professions,
    });

    // Create/update admin_users doc
    const targetUser = await auth.getUser(targetUid);
    await db.collection('admin_users').doc(targetUid).set({
      role,
      professions,
      email: targetUser.email || '',
      display_name: displayName || targetUser.displayName || '',
      created_by: caller.uid,
      created_at: FieldValue.serverTimestamp(),
      last_login: null,
      last_login_ip: null,
      allowed_ips: [],
      session_timeout_minutes: 30,
      status: 'active',
    }, { merge: true });

    // Audit log
    await db.collection('admin_audit_log').add({
      action: 'assign_admin_role',
      performed_by: caller.uid,
      target_user: targetUid,
      role: caller.role,
      profession: 'system',
      ip_address: context.rawRequest?.ip || 'unknown',
      reason: `Assigned ${role} for ${professions.join(',')}`,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

// ─── Remove admin role from a user ──────────────────────────────
export const removeAdminRole = functions.region('asia-south1').https.onCall(
  async (data: { targetUid: string }, context) => {
    const caller = await requireRole(context, ['super_admin']);

    await auth.setCustomUserClaims(data.targetUid, {
      admin_role: null,
      admin_professions: null,
    });

    await db.collection('admin_users').doc(data.targetUid).update({
      status: 'disabled',
    });

    await db.collection('admin_audit_log').add({
      action: 'remove_admin_role',
      performed_by: caller.uid,
      target_user: data.targetUid,
      role: caller.role,
      profession: 'system',
      ip_address: context.rawRequest?.ip || 'unknown',
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

// ─── Verify admin access (called on login) ──────────────────────
export const verifyAdminAccess = functions.region('asia-south1').https.onCall(
  async (_data, context) => {
    const result = await requireRole(context, ['super_admin', 'profession_admin', 'support_agent', 'viewer']);

    // Log login
    await db.collection('admin_audit_log').add({
      action: 'admin_login',
      performed_by: result.uid,
      target_user: result.uid,
      role: result.role,
      profession: 'system',
      ip_address: context.rawRequest?.ip || 'unknown',
      timestamp: FieldValue.serverTimestamp(),
    });

    // Update last_login
    await db.collection('admin_users').doc(result.uid).update({
      last_login: FieldValue.serverTimestamp(),
      last_login_ip: context.rawRequest?.ip || 'unknown',
    });

    return {
      role: result.role,
      professions: result.professions,
    };
  }
);

// ─── List all admin users ───────────────────────────────────────
export const listAdminUsers = functions.region('asia-south1').https.onCall(
  async (_data, context) => {
    await requireRole(context, ['super_admin']);

    const snapshot = await db.collection('admin_users').where('status', '==', 'active').get();
    const admins = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    return { admins };
  }
);
```

**Step 2: Commit**

```bash
git add functions/src/adminRoles.ts
git commit -m "feat: add role-based admin middleware with IP allowlisting and audit logging"
```

---

### Task 6: Create admin analytics Cloud Functions

**Files:**
- Create: `functions/src/adminAnalytics.ts`

**Step 1: Create `functions/src/adminAnalytics.ts`**

```typescript
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
```

**Step 2: Commit**

```bash
git add functions/src/adminAnalytics.ts
git commit -m "feat: add admin analytics Cloud Functions for per-profession stats"
```

---

### Task 7: Update Cloud Functions index.ts exports

**Files:**
- Modify: `functions/src/index.ts`

**Step 1: Add new exports**

Add to the "Super Admin Dashboard" section (replace existing admin exports):

```typescript
// Super Admin Dashboard (Enhanced)
export { verifyAdminAccess, assignAdminRole, removeAdminRole, listAdminUsers } from "./adminRoles";
export { approveDoctor, suspendUser, overrideSubscription, getAdminStats } from "./adminActions";
export { getProfessionStats, getGlobalStats, getProfessionUsers, getAuditLog } from "./adminAnalytics";
export { sendBulkPush } from "./sendPushNotification";
```

Remove the old exports:
```typescript
// DELETE these two lines:
export { setAdminClaim, checkAdminStatus } from "./adminAuth";
```

**Step 2: Build and verify functions compile**

```bash
cd functions && npm run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add functions/src/index.ts
git commit -m "feat: update Cloud Function exports with new role-based admin functions"
```

---

## Phase 3: Admin Frontend — Auth & Shell

### Task 8: Create admin app entry point and auth system

**Files:**
- Create: `src-admin/main.tsx`
- Create: `src-admin/AdminApp.tsx`
- Create: `src-admin/auth/useAdminAuth.ts`
- Create: `src-admin/auth/AdminLogin.tsx`
- Create: `src-admin/auth/AdminAuthGuard.tsx`

**Step 1: Create `src-admin/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AdminApp from './AdminApp';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },    // Indigo
    secondary: { main: '#ec4899' },  // Pink
    background: {
      default: '#0f172a',            // Slate-900
      paper: '#1e293b',             // Slate-800
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
  },
  shape: { borderRadius: 12 },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
```

**Step 2: Create `src-admin/auth/useAdminAuth.ts`**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../shared/firebase/config';

type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

interface AdminAuthState {
  user: User | null;
  role: AdminRole | null;
  professions: string[];
  loading: boolean;
  error: string | null;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null, role: null, professions: [], loading: true, error: null,
  });
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      signOut(auth);
      setState(prev => ({ ...prev, user: null, role: null, professions: [], error: 'Session expired. Please log in again.' }));
    }, SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, professions: [], loading: false, error: null });
        return;
      }

      try {
        const verifyAccess = httpsCallable<void, { role: AdminRole; professions: string[] }>(
          functions, 'verifyAdminAccess'
        );
        const result = await verifyAccess();
        setState({
          user,
          role: result.data.role,
          professions: result.data.professions,
          loading: false,
          error: null,
        });
        resetIdleTimer();
      } catch (err: any) {
        setState({
          user,
          role: null,
          professions: [],
          loading: false,
          error: err.message || 'Access denied',
        });
      }
    });

    return () => unsubscribe();
  }, [resetIdleTimer]);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setState({ user: null, role: null, professions: [], loading: false, error: null });
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.role) return false;
    const PERMISSIONS: Record<AdminRole, string[]> = {
      super_admin: ['view_dashboard','manage_users','approve_users','suspend_users','override_subscriptions','manage_settings','manage_roles','view_analytics','send_notifications','manage_tax_engine','view_audit_log','manage_ai_usage'],
      profession_admin: ['view_dashboard','manage_users','approve_users','suspend_users','override_subscriptions','manage_settings','view_analytics','send_notifications','view_audit_log'],
      support_agent: ['view_dashboard','manage_users','approve_users','suspend_users','view_audit_log'],
      viewer: ['view_dashboard','view_analytics'],
    };
    return PERMISSIONS[state.role]?.includes(permission) ?? false;
  };

  const hasProfessionAccess = (professionId: string): boolean => {
    if (state.role === 'super_admin') return true;
    return state.professions.includes(professionId);
  };

  return { ...state, login, logout, hasPermission, hasProfessionAccess };
}
```

**Step 3: Create `src-admin/auth/AdminLogin.tsx`**

```typescript
import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useAdminAuth } from './useAdminAuth';

export default function AdminLogin() {
  const { login, loading, error } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    }}>
      <Card sx={{ maxWidth: 420, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>
            🔒 MyTracksy Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Authorized personnel only
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} margin="normal" required autoFocus />
            <TextField fullWidth label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)} margin="normal" required />
            <Button fullWidth type="submit" variant="contained" size="large"
              disabled={loading} sx={{ mt: 2, py: 1.5 }}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={3}>
            Protected under PDPA Sri Lanka. All actions are logged.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
```

**Step 4: Create `src-admin/auth/AdminAuthGuard.tsx`**

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAdminAuth } from './useAdminAuth';

type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

interface Props {
  children: React.ReactNode;
  requiredRoles?: AdminRole[];
  requiredPermission?: string;
  requiredProfession?: string;
}

export default function AdminAuthGuard({ children, requiredRoles, requiredPermission, requiredProfession }: Props) {
  const { user, role, loading, hasPermission, hasProfessionAccess } = useAdminAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Typography variant="h4">🚫 Access Denied</Typography>
        <Typography color="text.secondary" mt={1}>You don't have permission to view this page.</Typography>
      </Box>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  if (requiredProfession && !hasProfessionAccess(requiredProfession)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

**Step 5: Create `src-admin/AdminApp.tsx` (root router)**

```typescript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './auth/useAdminAuth';
import AdminLogin from './auth/AdminLogin';
import AdminAuthGuard from './auth/AdminAuthGuard';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import ProfessionLayout from './layouts/ProfessionLayout';

// Super Admin pages
import SuperDashboard from './super-admin/SuperDashboard';
import UserRoleManager from './super-admin/UserRoleManager';
import AuditLogViewer from './super-admin/AuditLogViewer';
import SystemSettings from './super-admin/SystemSettings';
import GlobalAnalytics from './super-admin/GlobalAnalytics';

// Profession pages
import ProfessionDashboard from './profession/ProfessionDashboard';
import UserDirectory from './profession/UserDirectory';
import VerificationQueue from './profession/VerificationQueue';
import SubscriptionManager from './profession/SubscriptionManager';
import ProfessionAnalytics from './profession/ProfessionAnalytics';
import ProfessionSettings from './profession/ProfessionSettings';

export default function AdminApp() {
  const { role, professions } = useAdminAuth();

  // Determine default redirect based on role
  const getDefaultRedirect = () => {
    if (role === 'super_admin') return '/';
    if (professions.length > 0) return `/profession/${professions[0]}`;
    return '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />

      {/* Super Admin routes */}
      <Route path="/" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><SuperDashboard /></SuperAdminLayout>
        </AdminAuthGuard>
      } />
      <Route path="/roles" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><UserRoleManager /></SuperAdminLayout>
        </AdminAuthGuard>
      } />
      <Route path="/audit" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><AuditLogViewer /></SuperAdminLayout>
        </AdminAuthGuard>
      } />
      <Route path="/settings" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><SystemSettings /></SuperAdminLayout>
        </AdminAuthGuard>
      } />
      <Route path="/analytics" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><GlobalAnalytics /></SuperAdminLayout>
        </AdminAuthGuard>
      } />

      {/* Per-profession routes */}
      <Route path="/profession/:professionId" element={
        <AdminAuthGuard requiredRoles={['super_admin', 'profession_admin', 'support_agent', 'viewer']}>
          <ProfessionLayout><ProfessionDashboard /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/users" element={
        <AdminAuthGuard requiredPermission="manage_users">
          <ProfessionLayout><UserDirectory /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/verification" element={
        <AdminAuthGuard requiredPermission="approve_users">
          <ProfessionLayout><VerificationQueue /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/subscriptions" element={
        <AdminAuthGuard requiredPermission="override_subscriptions">
          <ProfessionLayout><SubscriptionManager /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/analytics" element={
        <AdminAuthGuard requiredPermission="view_analytics">
          <ProfessionLayout><ProfessionAnalytics /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/settings" element={
        <AdminAuthGuard requiredPermission="manage_settings">
          <ProfessionLayout><ProfessionSettings /></ProfessionLayout>
        </AdminAuthGuard>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
}
```

**Step 6: Verify admin build works**

```bash
npm run build:admin
```

Note: This will fail because layout and page components don't exist yet. That's expected — we create them in the next tasks. For now, create placeholder stub files to make the build pass.

**Step 7: Commit**

```bash
git add src-admin/
git commit -m "feat: add admin app entry point, auth system, and root router"
```

---

## Phase 4: Admin Frontend — Layouts & Super Admin Views

### Task 9: Create layout components (SuperAdminLayout + ProfessionLayout)

**Files:**
- Create: `src-admin/layouts/SuperAdminLayout.tsx`
- Create: `src-admin/layouts/ProfessionLayout.tsx`
- Create: `src-admin/shared/components/AdminSidebar.tsx`
- Create: `src-admin/shared/components/AdminHeader.tsx`

Build a dark-themed admin shell with:
- Fixed sidebar (240px) with navigation items
- Top header bar with user info, role badge, and logout
- Mobile responsive (collapsible sidebar)
- SuperAdminLayout sidebar: Dashboard, Role Management, Audit Log, System Settings, Analytics, Push Notifications, AI Usage, Tax Engine
- ProfessionLayout sidebar: Dashboard, Users, Verification, Subscriptions, Analytics, Settings + back-to-all button for super admins
- Use profession icon and color from `shared/constants/professions.ts` in ProfessionLayout header

**Step 1: Build each component with MUI (Drawer, AppBar, List, etc.)**

**Step 2: Commit**

```bash
git add src-admin/layouts/ src-admin/shared/components/
git commit -m "feat: add admin layout components with sidebar navigation"
```

---

### Task 10: Build Super Admin Dashboard with 12 profession tiles

**Files:**
- Create: `src-admin/super-admin/SuperDashboard.tsx`
- Create: `src-admin/shared/components/StatCard.tsx`
- Create: `src-admin/shared/components/ProfessionTile.tsx`

**Requirements:**
- Global overview bar at top: Total Users, Active Users, MRR (LKR), Churn Rate
- 4x3 responsive grid of ProfessionTile cards
- Each tile: icon, profession name, user count, growth % indicator
- Click tile → navigate to `/profession/{id}`
- Data from `getGlobalStats` Cloud Function
- Real-time listener on `admin_audit_log` for recent activity feed
- Use `PROFESSIONS` from `shared/constants/professions.ts` for config

**Step 1: Build StatCard reusable component**
**Step 2: Build ProfessionTile component**
**Step 3: Build SuperDashboard with grid layout and data fetching**
**Step 4: Commit**

```bash
git add src-admin/super-admin/SuperDashboard.tsx src-admin/shared/components/
git commit -m "feat: add Super Admin dashboard with 12 profession tiles"
```

---

### Task 11: Build User Role Manager (Super Admin only)

**Files:**
- Create: `src-admin/super-admin/UserRoleManager.tsx`

**Requirements:**
- Table of all admin users: email, role, professions, status, last login
- "Invite Admin" button → dialog: email, role dropdown, profession checkboxes
- Edit role/professions for existing admins
- Disable/enable admin accounts
- Calls `assignAdminRole`, `removeAdminRole`, `listAdminUsers` Cloud Functions

**Step 1: Build UserRoleManager**
**Step 2: Commit**

```bash
git add src-admin/super-admin/UserRoleManager.tsx
git commit -m "feat: add admin role management page"
```

---

### Task 12: Build Audit Log Viewer and System Settings

**Files:**
- Create: `src-admin/super-admin/AuditLogViewer.tsx`
- Create: `src-admin/super-admin/SystemSettings.tsx`
- Create: `src-admin/super-admin/GlobalAnalytics.tsx`

**AuditLogViewer Requirements:**
- Filterable table: by action type, user, profession, date range
- Columns: timestamp, action, performed by, target user, profession, IP
- Pagination (50 per page)
- Export CSV button
- Data from `getAuditLog` Cloud Function

**SystemSettings Requirements:**
- Session timeout (minutes) — editable number
- Maintenance mode toggle
- Rate limit per minute — editable number
- Reads/writes `system_settings/admin_config` Firestore doc

**GlobalAnalytics Requirements:**
- Line chart: user growth over time (Recharts)
- Bar chart: users per profession
- Pie chart: subscription distribution (free/pro/lifetime)
- MRR trend line

**Step 1-3: Build each component**
**Step 4: Commit**

```bash
git add src-admin/super-admin/
git commit -m "feat: add audit log viewer, system settings, and global analytics"
```

---

## Phase 5: Per-Profession Admin Views

### Task 13: Build Profession Dashboard

**Files:**
- Create: `src-admin/profession/ProfessionDashboard.tsx`

**Requirements:**
- Read `professionId` from URL params via `useParams()`
- KPI cards: Total Users, Active, Pending Verification, Pro Users, MRR, Suspended
- User growth chart (Recharts line chart)
- Revenue chart (Recharts bar chart)
- Recent activity feed from audit log (filtered by profession)
- Data from `getProfessionStats` Cloud Function
- Use profession color from `PROFESSION_MAP` for theming

**Step 1: Build ProfessionDashboard**
**Step 2: Commit**

```bash
git add src-admin/profession/ProfessionDashboard.tsx
git commit -m "feat: add per-profession dashboard with KPIs and charts"
```

---

### Task 14: Build User Directory and Verification Queue

**Files:**
- Create: `src-admin/profession/UserDirectory.tsx`
- Create: `src-admin/profession/VerificationQueue.tsx`

**UserDirectory Requirements:**
- Searchable, sortable table of users in this profession
- Columns: name, email, verification ID, status, subscription, joined date
- Filter buttons: All, Active, Pending, Suspended
- Actions per user: Approve, Suspend, Reactivate, Plan Override
- Pagination via `getProfessionUsers` Cloud Function
- Verification field label changes per profession (SLMC for medical, Bar # for legal, etc.) — use `PROFESSION_MAP[professionId].verificationLabel`

**VerificationQueue Requirements:**
- Filtered view: only `status === 'pending_verification'`
- Show verification document details
- Approve / Reject buttons
- Calls enhanced `approveDoctor` (rename to `approveUser`) Cloud Function

**Step 1-2: Build both components**
**Step 3: Commit**

```bash
git add src-admin/profession/UserDirectory.tsx src-admin/profession/VerificationQueue.tsx
git commit -m "feat: add user directory and verification queue for professions"
```

---

### Task 15: Build Subscription Manager, Analytics, and Settings

**Files:**
- Create: `src-admin/profession/SubscriptionManager.tsx`
- Create: `src-admin/profession/ProfessionAnalytics.tsx`
- Create: `src-admin/profession/ProfessionSettings.tsx`

**SubscriptionManager:** Plan override for users in this profession (free/pro/lifetime dropdown + reason field)

**ProfessionAnalytics:** User growth chart, subscription breakdown pie chart, AI usage bar chart — all filtered by profession

**ProfessionSettings:** Profession-specific configuration (verification requirements, custom fields) — stored in `system_settings/profession_config/{professionId}`

**Step 1-3: Build each component**
**Step 4: Commit**

```bash
git add src-admin/profession/
git commit -m "feat: add subscription manager, analytics, and settings for professions"
```

---

## Phase 6: Integration & Deployment

### Task 16: Verify full build pipeline

**Step 1: Build main app**
```bash
npm run build
```
Expected: Succeeds, output in `build/`

**Step 2: Build admin app**
```bash
npm run build:admin
```
Expected: Succeeds, output in `build-admin/`

**Step 3: Build functions**
```bash
cd functions && npm run build && cd ..
```
Expected: No TypeScript errors

**Step 4: Verify no admin references remain in main app**
```bash
grep -r "AdminApp\|/admin" src/ --include="*.tsx" --include="*.ts"
```
Expected: No matches (old admin code fully removed)

**Step 5: Commit if any fixes needed**

---

### Task 17: Create Firebase Hosting site and deploy

**Step 1: Create admin hosting site in Firebase**
```bash
firebase hosting:sites:create mytracksy-admin
```

**Step 2: Apply hosting targets**
```bash
firebase target:apply hosting main tracksy-8e30c
firebase target:apply hosting admin mytracksy-admin
```

**Step 3: Deploy everything**
```bash
npm run deploy
```

**Step 4: Verify both sites are live**
- Main app: `https://tracksy-8e30c.web.app` (or custom domain)
- Admin: `https://mytracksy-admin.web.app`

**Step 5: Connect custom domain `admin.mytracksy.lk`**

In Firebase Console: Hosting → mytracksy-admin → Add custom domain → `admin.mytracksy.lk`
Add DNS records as instructed (CNAME or A record).

**Step 6: Set founder as super_admin**

Run in Firebase Functions shell or create a one-time script:
```typescript
// Set custom claims for founder
admin.auth().setCustomUserClaims('eyuHN6ZeYZgi2fSBM3bmslfzAhX2', {
  admin_role: 'super_admin',
  admin_professions: ['all'],
});

// Create admin_users doc
admin.firestore().collection('admin_users').doc('eyuHN6ZeYZgi2fSBM3bmslfzAhX2').set({
  role: 'super_admin',
  professions: ['all'],
  email: 'ceo@mytracksy.lk',
  display_name: 'Founder',
  created_by: 'system',
  created_at: admin.firestore.FieldValue.serverTimestamp(),
  last_login: null,
  last_login_ip: null,
  allowed_ips: [],
  session_timeout_minutes: 30,
  status: 'active',
});
```

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete admin panel separation with multi-site hosting"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Foundation: shared types, Vite config, Firebase multi-site, remove /admin from main app |
| 2 | 5-7 | Cloud Functions: role-based middleware, analytics, updated exports |
| 3 | 8 | Admin frontend: entry point, auth system, router |
| 4 | 9-12 | Super Admin views: layouts, dashboard, roles, audit, settings |
| 5 | 13-15 | Per-profession views: dashboard, users, verification, subscriptions, analytics |
| 6 | 16-17 | Integration: full build verification, Firebase deploy, DNS setup |

**Total: 17 tasks across 6 phases**
**Estimated time: 8-12 hours of focused implementation**
