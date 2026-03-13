# LegalDashboard Production Upgrade Design

**Date:** 2026-03-12
**Status:** Approved
**Goal:** Bring LegalDashboard.tsx to full production parity with MedicalDashboard.tsx + 3 lawyer-specific features

## Context

- **MedicalDashboard** (1,743 lines) — production-ready reference with Firebase, shared components, mobile shell, premium gating, voice input, deep linking
- **LegalDashboard** (1,071 lines) — has Court Diary, Cases, Trust Accounting working with Dexie, but 15 critical gaps vs Medical
- **LawyerLandingPage** (1,477 lines) — complete, no changes needed

## Architecture

### Data Layer
- Replace `localStorage.getItem('tracksyUser')` → `useAuth()` from `../../context/AuthContext`
- Integrate `accountingCoreService` for Firestore persistence (`addTransaction`, `subscribeTransactions`, `seedChartOfAccounts`)
- Keep Dexie for legal-specific tables (CourtDiaryEntry, TrustTransaction, CaseRecord) — they already work
- Import `GOLDEN_LIST` shared config for tax categorization
- Use `toCents`/`fromCents` for all monetary values
- Add `clientPhone` field to `CaseRecord` interface in db.ts

### Shared Component Integration (12 imports)
| Component | Purpose |
|-----------|---------|
| `KPICard` | Overview metrics cards |
| `TransactionList` | Income/expense transaction lists |
| `InvoiceForm` | Fee note generation (legal billing) |
| `VoiceInput` | Floating AI mic (replaces raw isRecording toggle) |
| `TaxSpeedometer` | APIT tax visualization |
| `ReceiptScanner` | Receipt capture and OCR |
| `AuditorExport` | Auditor-ready export package |
| `TransactionInbox` | Transaction review inbox |
| `BiometricGate` | Protect financial sections |
| `SubscriptionGate` | Gate premium features |
| `SubscriptionManager` | Subscription management tab |
| `MorningBriefing` | Court Day Briefing (premium) |
| `SmartScheduler` | Smart Scheduler (premium) |
| `LifeAdmin` | Life Admin (premium) |
| `AIVoiceVault` | Voice Vault (premium) |

### Mobile PWA Shell
- Import `useIsCompactMobile()` hook
- 5 mobile bottom tabs: Home | Court | Cases | Money | More
- `LEGAL_MOBILE_GROUPS` mapping ~20 nav items into 5 tab groups
- Pass `mobileShell` prop to DashboardLayout
- `renderMobileSectionNav()` for horizontal scrolling pills
- `gridColumns()` responsive helper throughout

### Navigation (expand 9 → 20 items)
```
Dashboard, Court Day Briefing*, Inbox, Court Diary, Cases & Clients,
Trust Accounting, Income & Fee Notes, Expenses, Tax & IRD, Receipts,
Documents, Reports, Auditor Export, AI Tools, Voice Vault*,
Smart Scheduler*, Life Admin*, Token Wallet, Subscription, Settings
(* = premium)
```

### Security
- `BiometricGate` around: Trust Accounting, Income & Fee Notes, Voice Vault
- `SubscriptionGate` around: Court Day Briefing, AI Tools, Voice Vault, Smart Scheduler, Life Admin
- URL `?action=` deep linking with `LEGAL_SHORTCUT_NAV` map
- `popstate` listener for browser navigation

## Additional Lawyer-Specific Features

### Document Templates Engine
- Auto-generate Sri Lankan legal documents from case data
- Templates: Fee Notes, Plaints, POA, Bail Applications, Deeds, NDAs
- Merge fields: `{{clientName}}`, `{{caseNumber}}`, `{{courtName}}`, etc.
- Export to PDF via jspdf + jspdf-autotable
- Upgrade existing Documents tab from static list to template engine

### Court Calendar Sync
- Export court diary entries to .ics format (iCalendar standard)
- Works with Google Calendar, Apple Calendar, Outlook
- Auto-set reminders: 1 day before + 1 hour before hearing
- Includes case title, court, judge, hearing type
- One-click "Add to Calendar" per entry + bulk export

### WhatsApp Integration
- Generate `wa.me` deep links with pre-filled messages
- Hearing reminders, case updates, invoice links
- One-tap send button next to each client entry
- Uses `https://wa.me/{phone}?text={encoded_message}` (no API needed)
- Client phone from `CaseRecord.clientPhone` field

## Files Modified
- `src/components/dashboards/LegalDashboard.tsx` — complete rewrite
- `src/lib/db.ts` — add `clientPhone` to `CaseRecord`, add document template interfaces
- `src/services/legalDocumentService.ts` — new: document template engine
- `src/services/calendarExportService.ts` — new: .ics calendar export
- `src/services/whatsappService.ts` — new: WhatsApp deep link generator

## Build Verification
- Zero new TypeScript errors
- All existing tests pass
- Mobile PWA responsive at 375px, 768px, 1280px
