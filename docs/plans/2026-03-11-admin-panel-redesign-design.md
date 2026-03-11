# MyTracksy Admin Panel Redesign — Design Document

**Date:** 2026-03-11
**Status:** Approved
**Author:** Claude + Nanthan (CEO)

---

## 1. Problem Statement

The current admin panel lives at `/admin` inside the main web app (`mytracksy.lk`). It is doctor-specific only, uses a single-tier admin role, and shares the same build/deploy artifact as the user-facing app. This needs to become a full SaaS-grade admin system supporting all 12 professions with proper role-based access, separate hosting, and high security.

## 2. Goals

- **Separate admin URL** (`admin.mytracksy.lk`) via Firebase multi-site hosting
- **Super Admin dashboard** with 12 profession tiles showing SaaS analytics
- **Per-profession admin panels** with full user management
- **4-tier role system**: Super Admin → Profession Admin → Support Agent → Viewer
- **High security**: Custom claims + IP allowlisting + session timeout + audit logging + rate limiting
- **PDPA compliant**: No clinical data exposed, metadata and counts only

## 3. Architecture

### 3.1 Approach: Monorepo with Separate Vite Entry Points

Same repository (`mytracksynew`), two Vite build configs producing two output directories. Firebase Hosting multi-site serves them on different subdomains.

```
firebase.json → two hosting targets:
  ├── "main"  → mytracksy.lk       → deploys from build/
  └── "admin" → admin.mytracksy.lk  → deploys from build-admin/
```

### 3.2 Directory Structure

```
mytracksynew/
├── src/                          # Main app (unchanged)
│   ├── App.tsx                   # REMOVE /admin routing
│   ├── main.tsx                  # Main app entry
│   └── ...
├── src-admin/                    # NEW — Admin panel source
│   ├── main.tsx                  # Admin entry point
│   ├── AdminApp.tsx              # Root router
│   ├── auth/
│   │   ├── AdminLogin.tsx
│   │   ├── AdminAuthGuard.tsx
│   │   └── useAdminAuth.ts
│   ├── super-admin/
│   │   ├── SuperDashboard.tsx    # 12-profession tile grid
│   │   ├── UserRoleManager.tsx   # Assign roles
│   │   ├── SystemSettings.tsx    # Global config
│   │   ├── AuditLogViewer.tsx    # Full audit trail
│   │   └── GlobalAnalytics.tsx   # Cross-profession analytics
│   ├── profession/
│   │   ├── ProfessionDashboard.tsx
│   │   ├── UserDirectory.tsx
│   │   ├── VerificationQueue.tsx
│   │   ├── SubscriptionManager.tsx
│   │   ├── ProfessionSettings.tsx
│   │   └── ProfessionAnalytics.tsx
│   ├── shared/
│   │   ├── components/           # Sidebar, Header, DataTable, StatCard
│   │   ├── hooks/                # useFirestore, useRealtime, usePagination
│   │   └── utils/                # formatCurrency, date helpers
│   └── layouts/
│       ├── SuperAdminLayout.tsx
│       └── ProfessionLayout.tsx
├── shared/                       # Shared between main app & admin
│   ├── types/
│   │   ├── user.ts
│   │   ├── profession.ts
│   │   └── admin.ts
│   ├── firebase/
│   │   └── config.ts
│   └── constants/
│       └── professions.ts        # 12 professions config
├── functions/src/
│   ├── adminAuth.ts              # ENHANCED — role-based
│   ├── adminActions.ts           # ENHANCED — per-profession
│   ├── adminRoles.ts             # NEW — role management
│   └── adminAnalytics.ts         # NEW — aggregation
├── admin.html                    # Admin entry HTML
├── vite.config.ts                # Main app build
├── vite.admin.config.ts          # Admin build config
└── firebase.json                 # Multi-site hosting
```

### 3.3 Build & Deploy

```json
// package.json scripts
{
  "build": "vite build",
  "build:admin": "vite build --config vite.admin.config.ts",
  "build:all": "npm run build && npm run build:admin",
  "deploy": "npm run build:all && firebase deploy"
}
```

## 4. Security Model

### 4.1 Four-Tier Role System

| Role | Custom Claim | Scope | Permissions |
|------|-------------|-------|-------------|
| Super Admin | `role: "super_admin"` | All 12 professions | Full CRUD, settings, roles, billing, analytics |
| Profession Admin | `role: "profession_admin", professions: [...]` | Assigned professions | Full CRUD within profession, settings, analytics |
| Support Agent | `role: "support_agent", professions: [...]` | Assigned professions | Approve/suspend/reactivate users. NO settings, NO billing |
| Viewer | `role: "viewer", professions: [...]` | Assigned professions | Read-only dashboards and analytics |

### 4.2 Security Layers

1. **Firebase Custom Claims** — Role + professions baked into JWT token
2. **Firestore Security Rules** — Block all admin collections unless claim matches
3. **Cloud Function Middleware** — `requireRole("profession_admin", "medical")` on every function
4. **IP Allowlisting** — Optional per-user, checked in Cloud Functions
5. **Session Timeout** — 30-minute idle timeout, force re-auth
6. **Rate Limiting** — 100 requests/min per user on Cloud Functions
7. **Full Audit Log** — Every action: who, what, when, IP, target (immutable)

### 4.3 Auth Flow

```
User visits admin.mytracksy.lk
  → AdminLogin.tsx (email/password)
  → Firebase Auth → get ID token
  → Cloud Function verifyAdminAccess()
    → Check custom claims for role
    → Check IP allowlist
    → Check account status (active/disabled)
    → Log login to audit_log
    → Return: { role, professions, permissions }
  → Route to correct dashboard based on role
  → 30-min idle timer starts
```

### 4.4 Firestore Admin Collection

```
admin_users/{uid}/
  ├── role: "super_admin" | "profession_admin" | "support_agent" | "viewer"
  ├── professions: ["medical", "legal"]
  ├── email: string
  ├── display_name: string
  ├── created_by: string (uid)
  ├── created_at: Timestamp
  ├── last_login: Timestamp
  ├── last_login_ip: string
  ├── allowed_ips: string[]
  ├── session_timeout_minutes: number (default: 30)
  └── status: "active" | "disabled"
```

## 5. Professions

| # | ID | Label | Icon | Verification Field |
|---|-----|-------|------|-------------------|
| 1 | medical | Medical | 🩺 | SLMC Number |
| 2 | legal | Legal | ⚖️ | Bar Registration |
| 3 | business | Business | 📈 | Business Registration |
| 4 | engineering | Engineering | ⚙️ | IESL Membership |
| 5 | trading | Trading | 📊 | Trading License |
| 6 | automotive | Automotive | 🚗 | Business Registration |
| 7 | marketing | Marketing | 📢 | Company Registration |
| 8 | travel | Travel | ✈️ | SLTDA License |
| 9 | transport | Transport | 🚛 | Transport License |
| 10 | retail | Retail | 🛒 | Business Registration |
| 11 | aquaculture | Aquaculture | 🐟 | NAQDA License |
| 12 | individual | Individual | 👤 | NIC Number |

## 6. UI Design

### 6.1 Super Admin Dashboard

- Global overview bar: Total Users, MRR (LKR), Active Users, Churn Rate
- 4x3 grid of profession tiles, each showing: icon, name, user count, growth %
- Click tile → enters per-profession admin panel
- Sidebar: Dashboard, Role Management, Audit Log, System Settings, Push Notifications, AI Usage Monitor, Tax Engine

### 6.2 Per-Profession Admin Panel

- Profession-specific header with back button to tile grid
- Sidebar: Dashboard, Users, Verification, Subscriptions, Analytics, Settings, Push, Audit
- Dashboard: KPI cards (Total, Active, Pending, Pro, MRR) + charts
- User Directory: Searchable/filterable table with actions (approve, suspend, plan override)
- Verification Queue: Pending approvals with profession-specific verification fields
- Analytics: User growth, revenue trends, churn, AI usage (Recharts)

### 6.3 Role Management (Super Admin only)

- Table of all admin users with role, professions, status, last login
- Invite new admin: email + role + profession assignment
- Edit/disable existing admin users

## 7. URL Routing

```
admin.mytracksy.lk/
  ├── /login
  ├── /                               # Dashboard (role-based redirect)
  ├── /roles                          # Super Admin only
  ├── /audit                          # Super Admin only
  ├── /settings                       # Super Admin only
  ├── /notifications                  # Super Admin only
  ├── /ai-usage                       # Super Admin only
  ├── /tax-engine                     # Super Admin only
  └── /profession/:professionId/
      ├── /                           # Profession dashboard
      ├── /users
      ├── /verification
      ├── /subscriptions
      ├── /analytics
      ├── /settings
      ├── /notifications
      └── /audit
```

Route guards enforce role + profession matching.

## 8. Firestore Data Model Changes

### 8.1 New Collections

```
admin_users/{uid}/                    # Admin user registry (Section 4.4)
admin_sessions/{uid}/                 # Active session tracking
  ├── last_activity: Timestamp
  ├── ip_address: string
  ├── user_agent: string
  └── expires_at: Timestamp

system_settings/admin_config/         # Global admin settings
  ├── session_timeout_minutes: 30
  ├── maintenance_mode: false
  └── rate_limit_per_minute: 100
```

### 8.2 Enhanced Collections

```
admin_audit_log/{entryId}/            # Add profession + IP fields
  ├── action, target_user, performed_by, timestamp (existing)
  ├── profession: string              # NEW
  ├── ip_address: string              # NEW
  └── role: string                    # NEW — who did it

users/{userId}/                       # Add profession field if missing
  └── profession: string              # medical, legal, business, etc.
```

## 9. Firebase Hosting Config

```json
{
  "hosting": [
    {
      "target": "main",
      "public": "build",
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [/* existing security headers */]
    },
    {
      "target": "admin",
      "public": "build-admin",
      "rewrites": [{ "source": "**", "destination": "/admin.html" }],
      "headers": [
        {
          "source": "**",
          "headers": [
            { "key": "X-Frame-Options", "value": "DENY" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "Strict-Transport-Security", "value": "max-age=5443200" },
            { "key": "Content-Security-Policy", "value": "frame-ancestors 'none'" },
            { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
          ]
        }
      ]
    }
  ]
}
```

## 10. Cloud Functions (New/Enhanced)

| Function | Purpose | Access |
|----------|---------|--------|
| `verifyAdminAccess` | Login verification + session creation | Any authenticated user |
| `assignAdminRole` | Set role + professions on a user | Super Admin only |
| `removeAdminRole` | Revoke admin access | Super Admin only |
| `getAdminStats` | Enhanced: per-profession aggregations | All admin roles |
| `getProfessionUsers` | Paginated user list for a profession | Profession Admin+ |
| `approveUser` | Profession-aware user approval | Support Agent+ |
| `suspendUser` | Enhanced: profession-scoped | Support Agent+ |
| `overrideSubscription` | Enhanced: profession-scoped | Profession Admin+ |
| `getAuditLog` | Filterable audit log query | All admin roles |
| `getAnalytics` | MRR, churn, growth calculations | Profession Admin+ |

## 11. Migration Plan

1. Move existing `src/admin/` components to `src-admin/` and refactor
2. Remove `/admin` routing from `src/App.tsx`
3. Create `vite.admin.config.ts` and `admin.html`
4. Set up Firebase multi-site hosting targets
5. Connect `admin.mytracksy.lk` subdomain
6. Enhance Cloud Functions with role-based middleware
7. Create new Firestore collections and security rules
8. Build and deploy both sites

## 12. Tech Stack

- **Frontend**: React 18 + TypeScript + MUI 5 + React Router 6 + Recharts
- **Backend**: Firebase Cloud Functions (Node.js 20, asia-south1)
- **Auth**: Firebase Auth + Custom Claims
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting (multi-site)
- **Build**: Vite 5
