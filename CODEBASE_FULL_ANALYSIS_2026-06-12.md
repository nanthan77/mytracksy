# MyTracksy — Full Codebase Analysis Report

**Date:** 2026-06-12 · **Scope:** Full application (215 TS/TSX files, Cloud Functions, Firestore rules, tests) · **Entry point analyzed live:** `http://localhost:5173/medical`
**Method:** Live browser inspection, static code analysis (2 deep-dive passes), full test/typecheck/lint run, external verification of tax rates against IRD 2025/26.

---

## 1. Executive Summary

| Area | Verdict |
|---|---|
| Live `/medical` route | ✅ Loads cleanly — marketing landing + PWA install banner, zero console errors |
| Tax engine (IRD 2025/26) | ✅ **Verified correct** (brackets + relief match official rates) |
| Money handling | ✅ Integer-cents based, idempotency keys |
| Payments (PayHere) | ✅ Solid (server-side hash, timing-safe compare) — 1 medium issue (5% tolerance) |
| Tests | ⚠️ 203/205 pass · 2 fail (test-harness config, not app bug) |
| Typecheck / Lint | ✅ Clean / ✅ Clean (0 warnings at `--max-warnings 0`) |
| Data persistence | 🔴 **Critical gaps** — 2 data-loss paths found |
| Security | ⚠️ Mostly solid; hardcoded founder bypass + client-only feature gating |
| Code hygiene | ⚠️ Significant dead code (6 stale `App-*.tsx`, dead router, dual contexts) |

**Top risk:** two independent data-loss paths (§6.1, §6.2) — user-entered data silently never reaches Firestore.

---

## 2. Live Route Check — `/medical`

- **URL:** `http://localhost:5173/medical` (Vite v6.4.2 dev server, ready in 771 ms)
- **Renders:** Unauthenticated profession landing — "MyTracksy Medical | Clinic, Tax & Practice Management for Sri Lankan Doctors"
- **Observed working:** nav (Clinical Intelligence / Financial Orchestration / Security / Pricing), Referral Drafts / Lab Trend Summaries / Patient Language Notes feature cards, PDPA (Act No. 9 of 2022) trust section, PWA install banner ("Install MyTracksy Doctor")
- **Console:** no errors or warnings captured
- **Resolution chain:** `getSlugFromPath('/medical')` → `PROFESSION_ROUTES['medical']` → unauthenticated → `ProfessionLandingPage`; after login → `ProfessionDashboard` → `case 'medical'` → `<MedicalDashboard />`

---

## 3. Architecture & App Flow

### 3.1 Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6, MUI 5, lazy-loaded dashboards |
| Routing | **Custom state-machine router** in `App.tsx` (`pushState`/`popstate`) — React Router exists but is dead code |
| State | React local state + Zustand (`useCompanyStore`, persisted) + Firestore real-time listeners |
| Offline | Dexie (IndexedDB) v1→v5 schema + custom `SyncEngine` (batched push, online listener, 5-min interval) |
| Backend | Firebase Auth + Firestore + Cloud Functions (PayHere, Gemini, admin, schedulers) |
| PWA | Workbox via vite-plugin-pwa (`injectManifest`), per-profession webmanifests via `ManifestUpdater` |
| i18n | i18next (en/si/ta) — initialized but **not used by dashboards** (hardcoded English) |

### 3.2 View state machine (`App.tsx`)

`landing → professionLanding → login → profession(setup) → dashboard`

| URL | Unauthenticated | Authenticated |
|---|---|---|
| `/` | LandingPage | ProfessionSetup / last dashboard |
| `/login` | SimpleLogin | redirect to dashboard |
| `/<slug>` | ProfessionLandingPage (marketing) | ProfessionDashboard |
| `/<slug>/income` etc. | landing | dashboard with sub-nav (`useRouteNav`) |

Auth gate: render blocked until `authReady` (Firebase `onAuthStateChanged`). Idle logout: 30 min (5 activity events). Guest/demo modes bypass Firebase with `guest_`/`demo_` UIDs.

### 3.3 Login → dashboard flow

1. `/medical` → landing → "Get Started" → `view='login'`
2. `signInWithEmailAndPassword` → `tracksyUser` to localStorage
3. `bootstrapFirebaseUser()` → merge `users/{uid}` profile + seed chart of accounts
4. `pushState('/medical')` → `view='dashboard'` → `MedicalDashboard`

### 3.4 Profession routes (15 + ~25 aliases)

medical (PWA), legal, engineering, business (PWA), individual, trading, automotive, marketing, travel, transportation, retail, aquaculture, tourism (PWA), creator (PWA), studios (PWA).
- ⚠️ `travel` and `tourism` are **separate routes/pricing but render the same `TravelDashboard`** (`ProfessionDashboard.tsx:109-110`, comment confirms intentional reuse — pricing pages will differ for an identical product)
- ⚠️ Alias `tutor → education` points to a non-existent profession (returns `null`)

### 3.5 Data flow

```
User action → optimistic React state → accountingCoreService.addTransaction()
   → Firestore users/{uid}/transactions  → onSnapshot → state re-hydrated
Offline → Dexie (sync_status='pending') → SyncEngine.pushPendingDataToCloud()
   → writeBatch(≤450) → mark 'synced'
```

---

## 4. Medical Module Deep-Dive (`MedicalDashboard.tsx`, ~1,960 lines)

### 4.1 Functions & sections (22 nav sections)

| Section | Persistence | Gate |
|---|---|---|
| Overview, Today, Banking, Wallet, Settings, Inbox, Receipts, Subscription | Firestore (where wired) | — |
| Income / Expenses | Firestore (`subscribeTransactions`, cleared txns) | BiometricGate |
| Reports, Briefing, Scheduler, LifeAdmin, Prescriptions, Tax, Export | Firestore | **PRO** (`renderFeatureGated`) |
| VoiceVault | Firestore | Biometric + PRO |
| **Channeling shifts** | 🔴 **React state only — lost on refresh** | — |
| **Quick notes** | 🔴 **React state only — lost on refresh** | — |
| **Appointments** | 🔴 **React state only — lost on refresh** | — |
| Patients | 🔴 Empty state, no data source; "Add Patient" has no handler | — |

### 4.2 Calculations

- `totalIncome/totalExpenses/netProfit` — straight sums over subscribed txns ✅
- WHT on channeling: 5% (`wht_deducted_cents`) — correct rate, flagged as estimate in code ✅
- ⚠️ Gov APIT: flat `govAnnual × 0.12` — simplification, not progressive APIT tables
- ⚠️ `privateAnnual = currentMonthIncome × 12` — annualizing one month skews tax projection
- ⚠️ Hardcoded KPIs in Patients ("This Month: 12, +4") despite empty registry
- `_upgradePromptFeature` set but never read; `firestoreReady` set but never used; `channelingData` const permanently `[]`

### 4.3 vs. other dashboards

Legal (court diary/trust ledger) and Engineering (BOQ, retention) **persist via Dexie**; Medical's equivalent trackers (channeling, notes, appointments) do not — the persistence gap is specific to Medical.

---

## 5. Services, Functions & Business Logic

### 5.1 Services layer (38 services) — highlights

| Service | State |
|---|---|
| `accountingCoreService` | ✅ Solid: cents, SHA-256 idempotency keys, seeded CoA. ⚠️ idempotency check is `getDocs`→`addDoc` (non-atomic — race) |
| `doctorFinanceService` | ✅ Full CRUD + gov income config + annual totals (Apr–Mar tax year) |
| `SyncEngine` (lib) | ✅ Real Firestore batched sync; PDPA zero-retention audio. ⚠️ pull/restore only runs when local txn count = 0 (no differential pull) |
| `syncService` (services) | 🔴 **Stub:** "server" = `localStorage` (`tracksy-expenses`, lines 204-476). Conflict detection is phantom |
| `geminiService` | ✅ Proxies via Cloud Functions; no client API key |
| `pdpaService`, `secureStorage`, `biometricAuthService` | ✅ Present and implemented |

### 5.2 Tax engine — externally verified ✅

`TaxSpeedometer.tsx:11-19`:

| Coded | Official IRD AY 2025/26 | Match |
|---|---|---|
| Personal relief 1,800,000 | 1,800,000 (effective 1 Apr 2025) | ✅ |
| 6% on first 1,000,000 | 6% on first 1,000,000 | ✅ |
| 18% / 24% / 30% on next 500k bands | 18% / 24% / 30% | ✅ |
| 36% on balance | 36% on balance | ✅ |

Math spot-check: `calculateTax(1,500,000)` = 60,000 + 90,000 = **150,000** ✅ (matches unit test).
⚠️ Caveats: calculation in rupee floats (final `Math.round` mitigates; cents would be cleaner). **Not modeled:** EPF/ETF (8/12/3%), VAT — notable omissions for a professional finance tracker.

### 5.3 Cloud Functions (~35) — PayHere flow

✅ Auth required → server-side price lookup (client can't inject amounts) → `MD5(merchantId+orderId+amount+currency+MD5(secret))` server-side → webhook: CORS locked to payhere.lk, **timing-safe MD5 compare**, idempotency via `webhook_events` transaction, card tokens server-only.
- ⚠️ `handleSubscriptionWebhook.ts:310` — accepts payment if `received ≥ expected × 0.95` (**5% underpayment window**)
- ⚠️ `spendTokens` — no integer/sanity check on `amount`
- ⚠️ `generateCorporateInvoice` — stores client `items[]`/`taxData` without schema validation
- 🔴 `adminPermissions.ts:8-9,69` — **hardcoded `FOUNDER_UID` + emails (`ceo@mytracksy.lk`, `nanthan77@gmail.com`) as irrevocable super-admin bypass**, circumventing the (otherwise well-designed) role/claims/audit system

### 5.4 Firestore rules

✅ Strong: per-user isolation; `subscription`, `wallet`, `payment_methods` are `write: if false` (server-only); txn field validation (source whitelist, int cents 0–99,999,999, desc ≤500); append-only audit log.
⚠️ Gaps: no explicit rules for `webhook_events`, `admin_sessions` (implicit deny today, fragile); legacy `/expenses`/`/income` are **read-only yet `useExpenses`/`expenseService` still write there** → silent permission-denied; company owner update rule doesn't restrict field changes.

### 5.5 Input security

✅ No `dangerouslySetInnerHTML` anywhere; React escaping; `inputSanitizer.ts` is well built (tag/`javascript:`/handler stripping, proto-pollution-safe `sanitizeObject`, си/தமிழ் currency-aware amount parsing, SL phone normalization).
⚠️ Minor: password min length 6; `sanitizeText` misses encoded entities/homoglyphs; filename sanitizer misses Windows reserved names; `payhere.ts` doesn't pin `actionUrl` to `payhere.lk`.
✅ `.env` is **not tracked in git** (verified `git ls-files`/history). Firebase web keys are public-by-design; recommend enabling **App Check** anyway.

---

## 6. Ranked Findings

### 🔴 Critical

| # | Finding | Location | Impact |
|---|---|---|---|
| 1 | `syncService` "server" is localStorage — non-company expenses never reach Firestore | `src/services/syncService.ts:204-476` | Permanent data loss on clear-storage/device switch |
| 2 | Medical channeling shifts, quick notes, appointments unpersisted | `MedicalDashboard.tsx` state | Doctor's logged data vanishes on refresh |
| 3 | `useExpenses` writes to read-only legacy `/expenses` path | `src/hooks/useExpenses.ts` + `firestore.rules` | Silent permission-denied; writes appear to succeed in UI |

### 🟠 High

| # | Finding | Location |
|---|---|---|
| 4 | Hardcoded founder super-admin bypass (no revocation path) | `functions/src/adminPermissions.ts:8-9,69` |
| 5 | Feature gating is client-side only (PRO gates are presentational) | `featureGating.ts` + rules |
| 6 | Dual sync engines (real `SyncEngine` vs localStorage `syncService`) → split-brain storage | `src/lib/` vs `src/services/` |
| 7 | PayHere 5% underpayment tolerance | `handleSubscriptionWebhook.ts:310` |
| 8 | Non-atomic idempotency check (duplicate txn race) | `accountingCoreService.ts:210-227` |

### 🟡 Medium

| # | Finding |
|---|---|
| 9 | 2 failing tests: vitest resolves **production React** → `act()` unsupported (`useAdminAuth.test.tsx`) — harness config, fix in `vitest.config.ts` (force `NODE_ENV=test` / dev React) |
| 10 | `travel` + `tourism`: two routes/pricings, one dashboard |
| 11 | Gov APIT flat 12% + month×12 annualization skew tax projections |
| 12 | `generateCorporateInvoice` unvalidated payload; `spendTokens` weak amount validation |
| 13 | Missing explicit rules: `webhook_events`, `admin_sessions` |
| 14 | i18n (si/ta) initialized but dashboards hardcode English |

### 🟢 Low / Hygiene

Dead code: unused `AppRouter.tsx` + entire `src/pages/*` tree, 6 stale `App-*.tsx` variants, `CreatorDashboard.old.tsx`, dual `src/context`/`src/contexts`, broken-typed `ProtectedRoute`; hardcoded patient KPIs & placeholder Settings; reused shortcut icons in `medical.webmanifest`; `tutor→education` dead alias; Dexie missing compound `(userId, sync_status)` index; password policy 6 chars.

---

## 7. Test Suite — Full Results

**Run:** `vitest run` · 11 files · **205 tests · 203 ✅ / 2 ❌** · 1.99 s · typecheck (app+functions) ✅ · eslint `--max-warnings 0` ✅

| Suite | Tests | Result |
|---|---|---|
| `admin/permissions.test.ts` | 45 | ✅ |
| `utils/inputSanitizer.test.ts` | 45 | ✅ |
| `config/professionRoutes.test.ts` | 24 | ✅ |
| `admin/authGuard.test.ts` | 23 | ✅ |
| `utils/validation.test.ts` | 21 | ✅ |
| `config/featureGating.test.ts` | 15 | ✅ |
| `admin/professions.test.ts` | 14 | ✅ |
| `admin/sessionTimeout.test.ts` | 8 | ✅ |
| `src-admin/shared/api/adminApi.test.ts` | 5 | ✅ |
| `utils/taxSpeedometer.test.ts` | 3 | ✅ |
| `src-admin/auth/useAdminAuth.test.tsx` | 2 | ❌ `act(...) not supported in production builds of React` |

**Coverage gaps (untested):** all 38 services (incl. `accountingCoreService`, `doctorFinanceService`, `SyncEngine`), all Cloud Functions (incl. PayHere webhooks), all dashboard components, hooks (`useExpenses`, `useBudgets`, `useTokenWallet`), Firestore rules (no emulator tests), zero E2E.

---

## 8. Recommended Action Plan

| Priority | Action |
|---|---|
| P0 | Persist Medical channeling/notes/appointments (Dexie + SyncEngine, like Legal/Engineering dashboards) |
| P0 | Delete/deprecate `syncService.ts` localStorage stub; route everything through `SyncEngine` + `accountingCoreService` |
| P0 | Migrate `useExpenses`/`expenseService` to `users/{uid}/transactions` |
| P1 | Replace founder hardcode with MFA-protected custom-claims admin; add explicit deny rules for `webhook_events`/`admin_sessions`; enforce tier server-side (rules or `subscriptionGuard`) |
| P1 | Tighten PayHere tolerance to ≤ LKR 1; make idempotency atomic (`setDoc` keyed by idempotency hash) |
| P1 | Fix vitest React-production resolution to recover the 2 failing tests |
| P2 | Purge dead code (AppRouter, `App-*.tsx`, `src/pages`, dual contexts); split travel/tourism or unify pricing; wire i18n into dashboards; add service/function/rules tests + E2E (Playwright) |

---

## 9. Verification Notes (claims independently re-checked)

- ✅ Tax brackets confirmed against IRD AY 2025/26 publications — **code is correct** (an initial analysis pass flagged them as outdated; that was a false alarm and is corrected here)
- ✅ `.env` confirmed **untracked** in git (initial "committed secrets" flag downgraded)
- ✅ `shared/types/admin` exists at repo root — admin test imports valid (23/23 passing)
- ✅ `FOUNDER_UID` bypass, `syncService` localStorage stub, travel/tourism shared dashboard — all confirmed in source with line numbers

*Generated by Claude · live app + static analysis + test execution · 2026-06-12*
