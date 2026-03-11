# LexTracksy — Lawyer Profession Enhancement Design

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Full frontend + landing page; AI tools shown as "Coming Soon" UI

## Overview

Enhance the lawyer profession in MyTracksy to a fully branded "LexTracksy" experience. Follows the same pattern as DoctorLandingPage.tsx — a dedicated landing page at `/legal` with a completely rewritten LegalDashboard.tsx, profession-specific 3-tier pricing, and new Dexie tables for offline-first court diary and trust accounting.

## Decisions

- **Deployment:** Dedicated `/legal` route in the same codebase (not a separate subdomain)
- **Pricing:** Profession-specific pricing config. Medical keeps 2 tiers. Legal gets 3 tiers.
- **Scope:** Full frontend + landing page first. Backend AI tools (Letter of Demand, Vision AI, Judgment Summarizer) display as UI cards with "Coming Soon" badges.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/components/LawyerLandingPage.tsx` | Premium legal marketing page at `/legal` |
| `src/config/pricingConfig.ts` | Per-profession pricing tier definitions |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/dashboards/LegalDashboard.tsx` | Complete rewrite — Trust/Operating wallet, Smart Court Diary, AI tools panel, FAB voice recorder |
| `src/config/professionRoutes.ts` | Set `dedicatedPwa: true` for legal, update branding to "LexTracksy" |
| `src/lib/db.ts` | Add `court_diary`, `trust_transactions`, `case_records` Dexie tables |
| `src/components/SubscriptionManager.tsx` | Read from pricingConfig, support 3-tier rendering |
| `src/App.tsx` | Add `/legal` route pointing to LawyerLandingPage |

## LawyerLandingPage.tsx

### Theme
- **Background:** Premium Legal Navy Blue (`#0f172a` / slate-950)
- **Accents:** Gold (`#f59e0b` / amber-500)
- **Headings:** Serif font (Playfair Display) for legal tradition
- **Body:** Clean sans-serif (Inter or Plus Jakarta Sans)
- **SEO:** Full Helmet metadata, JSON-LD schema, Open Graph tags

### Sections

1. **Hero Section**
   - Headline: "You Mastered the Law. Let AI Master Your Chambers."
   - Sub-headline: "Manage Court Diaries, automate Client Trust Accounting, and draft legal documents with AI engineered for Sri Lankan Attorneys."
   - CTAs: "Start 14-Day Free Trial" + "Watch Demo"
   - Dark navy background with gold accent glows

2. **Features Grid (3 Columns)**
   - Smart Court Diary: "Detects clashes between Hulftsdorp and Outstation courts. Instant Conflict of Interest checks."
   - Trust & Retainer Ledger: "Stop mixing client retainers with your operating income. Generate 1-Click PDF Fee Notes to recover out-of-pocket court stamps."
   - AI Case Minutes: "Speak your case updates in English or Sinhala as you walk out of the courtroom. The AI formats it and updates your diary offline."

3. **Elite AI Add-Ons Section**
   - Generate Letters of Demand in seconds
   - Extract Title Details from 50-year-old faded deeds using Vision AI
   - Summarize Supreme Court Judgments

4. **Security Banner**
   - "Bank-Grade AES-256 Encryption"
   - "Strict Attorney-Client Privilege Protocols"
   - "100% Compliant with Sri Lanka PDPA No. 9 of 2022"

5. **Pricing Section**
   - Monthly/Annual toggle
   - Junior Counsel (Free): Smart Court Diary, Manual Ledger, 5 AI Voice Case Minutes/month
   - Independent Counsel (LKR 2,900/mo or LKR 29,000/yr): Trust vs Operating Accounting, 1-Click Fee Notes, Unlimited AI Voice Vault, Conflict of Interest Scanner, 50 AI Tokens. Badge: "100% Tax Deductible BASL Professional Expense"
   - The Chambers Plan (LKR 9,900/mo or LKR 99,000/yr): Everything in Pro + Multi-User Junior Login, Notary Public Escrow Dashboard, 250 AI Tokens
   - AI Token Store: LKR 1,500 for 100 Tokens

6. **Footer**
   - Links: Terms, Privacy, PDPA
   - Credit: "Designed & Engineered by SafeNet Creations" (linked to https://safenetcreations.com)

## LegalDashboard.tsx (Complete Rewrite)

### Navigation Tabs
- Overview (Dashboard home)
- Court Diary
- Cases & Clients
- Trust Accounting
- AI Tools
- Documents
- Billing
- Reports
- Settings

### Key Components

#### Trust vs Operating Dual-Wallet (Top of Dashboard)
- **Left Card (Gray/Neutral):** "Client Retainers Held in Trust" — shows total liability/unearned cash
- **Right Card (Green):** "My Taxable Operating Income" — shows real money earned
- **Action Row:** "Log Appearance Fee" button + "Log Out-of-Pocket Expense" button (Court stamps/Typist)

#### Smart Court Diary (Today's Cause List)
- List view of today's cases from local Dexie DB via `useLiveQuery`
- Each entry: case number, court name, court number, time, judge, hearing type
- **Conflict Detection:** If a user schedules a "Trial" in "Gampaha High Court" on a day they already have a "Mention" in "Colombo District Court", render red alert: "Travel Conflict Detected"
- Supports: Hulftsdorp courts vs. Outstation courts distinction

#### AI Tools Panel (Grid)
- "Draft Letter of Demand (1 Token)" — Coming Soon badge
- "Summarize SLR Judgment (5 Tokens)" — Coming Soon badge
- "Extract Faded Deed Data (3 Tokens)" — Coming Soon badge
- Token balance badge in header: "45 Tokens"

#### FAB Voice Recorder
- Large microphone icon, center-bottom, always visible
- Records "AI Case Minutes" offline
- Implements `navigator.wakeLock.request('screen')` while recording
- Supports English and Sinhala

#### Currency Formatting
- All amounts: `Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' })`

### Professional Settings
- BASL Registration Number
- Notary Public License Number
- Professional Indemnity Insurance
- IRD TIN Number

### Sample Data (for initial display)
- 5 sample cases (Civil, Criminal, Corporate, Estate, IP Law)
- Court calendar with Colombo, Kandy, Gampaha courts
- Legal expense categories: Office Rent, Staff & Clerks, Court Fees, Research/Journals, Travel (Court), Bar Association, Office Supplies, Insurance
- Bank accounts: Legal Practice A/C, Client Trust A/C, Savings

## Pricing Config System

### New file: `src/config/pricingConfig.ts`

```typescript
export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number;   // LKR, 0 for free
  annualPrice: number;     // LKR, 0 for free
  features: string[];
  aiTokens: number;        // monthly included tokens
  badge?: string;
  highlighted?: boolean;
  tierKey: 'free' | 'pro' | 'chambers';
}

export interface ProfessionPricing {
  profession: ProfessionType;
  tiers: PricingTier[];
  tokenStore: { price: number; tokens: number };
}
```

Medical pricing stays as-is (free + pro). Legal pricing adds 3 tiers mapped to:
- `free` → Junior Counsel
- `pro` → Independent Counsel
- `chambers` → The Chambers Plan

SubscriptionManager reads from this config to render the correct number of tiers per profession.

Backend `SubData.tier` type extends to: `'free' | 'pro' | 'chambers'`

## Dexie DB Updates

Add to `src/lib/db.ts`:

```
court_diary:
  ++id, date, caseId, court, courtNo, time, judge, hearingType,
  notes, status, sync_status, userId, firestoreId

trust_transactions:
  ++id, date, clientId, clientName, type[appearance_fee|court_stamp|typist_fee|retainer_receipt],
  amount, description, category, account[trust|operating],
  sync_status, userId, firestoreId

case_records:
  ++id, clientName, caseTitle, caseNumber, caseType[civil|criminal|corporate|estate|ip],
  court, judge, status[active|pending|completed|archived],
  retainerBalance, totalBilled, totalPaid,
  sync_status, userId, firestoreId
```

All follow existing pattern: `sync_status: 'pending' | 'synced' | 'error'`

## Out of Scope (Future Sprints)

- Backend Cloud Functions for AI tools (Letter of Demand, Vision AI, Judgment Summarizer)
- Conflict of Interest Scanner (backend search logic)
- Multi-User Junior Login system (Chambers Plan auth)
- Notary Public Escrow Dashboard (backend transaction tracking)
- PayHere integration for 3-tier billing
- AI Token Store purchase flow
