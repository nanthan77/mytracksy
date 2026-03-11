# LexTracksy — Lawyer Profession Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the lawyer profession in MyTracksy into a fully branded "LexTracksy" experience with a dedicated landing page, 3-tier pricing, offline-first court diary/trust accounting, and an AI tools panel.

**Architecture:** Follows the existing DoctorLandingPage pattern — a dedicated landing page at `/legal` that renders via ProfessionLandingPage's slug switch, plus a complete rewrite of LegalDashboard.tsx with Trust/Operating wallets, Smart Court Diary, and AI Tools panel. New Dexie tables enable offline-first data. A new pricingConfig.ts centralizes per-profession pricing tiers.

**Tech Stack:** React 18 + TypeScript + Vite, Dexie.js (IndexedDB), Firebase/Firestore, react-helmet-async, Inline CSS (no Tailwind), Intl.NumberFormat for LKR currency.

**Design Doc:** `docs/plans/2026-03-11-lextracksy-lawyer-profession-design.md`

---

## Task 1: Create Pricing Config System

**Files:**
- Create: `src/config/pricingConfig.ts`

**Step 1: Create the pricing config file**

```typescript
// src/config/pricingConfig.ts
import { ProfessionType } from '../contexts/AuthContext';

export type TierKey = 'free' | 'pro' | 'chambers';

export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number;   // LKR, 0 for free
  annualPrice: number;     // LKR, 0 for free
  features: string[];
  aiTokens: number;        // monthly included tokens
  badge?: string;
  highlighted?: boolean;
  tierKey: TierKey;
}

export interface ProfessionPricing {
  profession: ProfessionType;
  tiers: PricingTier[];
  tokenStore: { price: number; tokens: number };
}

// ─── Medical Pricing (Existing — 2 tiers) ────────────────────────
const medicalPricing: ProfessionPricing = {
  profession: 'medical',
  tiers: [
    {
      id: 'medical-free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Transactions/month',
        'Basic Reports',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'medical-pro',
      name: 'Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Unlimited Transactions',
        'AI Clinical Notes',
        'Prescription Manager',
        'Tax Automation',
        'Multi-Hospital Support',
        'Cloud Backup & Sync',
        'Priority Support',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible SLMC Professional Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ─── Legal Pricing (New — 3 tiers) ────────────────────────────────
const legalPricing: ProfessionPricing = {
  profession: 'legal',
  tiers: [
    {
      id: 'legal-free',
      name: 'Junior Counsel',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Smart Court Diary',
        'Manual Trust Ledger',
        '5 AI Voice Case Minutes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'legal-pro',
      name: 'Independent Counsel',
      monthlyPrice: 2900,
      annualPrice: 29000,
      features: [
        'Trust vs Operating Accounting',
        '1-Click PDF Fee Notes',
        'Unlimited AI Voice Vault',
        'Conflict of Interest Scanner',
        '50 AI Tokens/month',
        'Cloud Backup & Sync',
        'Priority Support',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible BASL Professional Expense',
      highlighted: true,
      tierKey: 'pro',
    },
    {
      id: 'legal-chambers',
      name: 'The Chambers Plan',
      monthlyPrice: 9900,
      annualPrice: 99000,
      features: [
        'Everything in Independent Counsel',
        'Multi-User Junior Login',
        'Notary Public Escrow Dashboard',
        '250 AI Tokens/month',
        'Dedicated Account Manager',
        'Custom Branding',
      ],
      aiTokens: 250,
      highlighted: false,
      tierKey: 'chambers',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ─── Pricing Registry ─────────────────────────────────────────────
const pricingRegistry: Partial<Record<ProfessionType, ProfessionPricing>> = {
  medical: medicalPricing,
  legal: legalPricing,
};

/** Get pricing config for a profession. Falls back to a default 2-tier if none defined. */
export function getPricingForProfession(profession: ProfessionType): ProfessionPricing {
  return pricingRegistry[profession] || {
    profession,
    tiers: [
      {
        id: `${profession}-free`,
        name: 'Free',
        monthlyPrice: 0,
        annualPrice: 0,
        features: ['50 Transactions/month', 'Basic Reports', 'Offline Mode'],
        aiTokens: 0,
        tierKey: 'free' as TierKey,
      },
      {
        id: `${profession}-pro`,
        name: 'Pro',
        monthlyPrice: 2900,
        annualPrice: 25000,
        features: ['Unlimited Transactions', 'AI Features', 'Cloud Sync', 'Priority Support'],
        aiTokens: 50,
        highlighted: true,
        tierKey: 'pro' as TierKey,
      },
    ],
    tokenStore: { price: 1500, tokens: 100 },
  };
}
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit src/config/pricingConfig.ts`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/config/pricingConfig.ts
git commit -m "feat(legal): add per-profession pricingConfig with legal 3-tier system"
```

---

## Task 2: Update Dexie DB — Add Legal Tables

**Files:**
- Modify: `src/lib/db.ts`

**Step 1: Add new interfaces after existing interfaces (after line 81)**

Add these interfaces after the `LocalReceipt` interface:

```typescript
export interface CourtDiaryEntry {
  id?: number;
  date: string;
  caseId: string;
  caseTitle?: string;
  court: string;
  courtNo: string;
  time: string;
  judge: string;
  hearingType: 'trial' | 'mention' | 'inquiry' | 'support' | 'argument' | 'judgment' | 'other';
  notes?: string;
  status: 'confirmed' | 'tentative' | 'adjourned' | 'completed' | 'cancelled';
  courtLocation: 'hulftsdorp' | 'outstation';
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface TrustTransaction {
  id?: number;
  date: string;
  clientId: string;
  clientName: string;
  type: 'appearance_fee' | 'court_stamp' | 'typist_fee' | 'retainer_receipt' | 'refund' | 'transfer';
  amount: number;
  description: string;
  category: string;
  account: 'trust' | 'operating';
  caseId?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface CaseRecord {
  id?: number;
  clientName: string;
  caseTitle: string;
  caseNumber: string;
  caseType: 'civil' | 'criminal' | 'corporate' | 'estate' | 'ip' | 'family' | 'labour' | 'other';
  court: string;
  judge: string;
  status: 'active' | 'pending' | 'completed' | 'archived';
  retainerBalance: number;
  totalBilled: number;
  totalPaid: number;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}
```

**Step 2: Add table declarations to the class (after line 88)**

Add inside `class MyTracksyLocalDB extends Dexie`:

```typescript
  court_diary!: Table<CourtDiaryEntry>;
  trust_transactions!: Table<TrustTransaction>;
  case_records!: Table<CaseRecord>;
```

**Step 3: Add version 2 migration (after version 1 block, line 99)**

Keep version 1 as-is. Add version 2:

```typescript
    this.version(2).stores({
      transactions: '++id, date, amount, category, type, sync_status, userId, createdAt, firestoreId',
      clinical_notes: '++id, date, patientId, noteType, sync_status, userId, createdAt, firestoreId',
      offline_audio_queue: '++id, timestamp, status, userId, purpose',
      wallet_transactions: '++id, type, status, userId, createdAt, sync_status, firestoreId',
      receipts: '++id, date, amount, vendor, category, sync_status, userId, createdAt, firestoreId',
      court_diary: '++id, date, caseId, court, courtNo, time, hearingType, status, courtLocation, sync_status, userId, firestoreId',
      trust_transactions: '++id, date, clientId, type, amount, account, caseId, sync_status, userId, firestoreId',
      case_records: '++id, caseNumber, caseType, court, status, clientName, sync_status, userId, firestoreId',
    });
```

**Step 4: Update getPendingSyncCount (around line 106)**

Add the 3 new tables to the Promise.all:

```typescript
export async function getPendingSyncCount(userId: string): Promise<number> {
  const [txn, notes, audio, wallet, receipts, diary, trust, cases] = await Promise.all([
    db.transactions.where({ sync_status: 'pending', userId }).count(),
    db.clinical_notes.where({ sync_status: 'pending', userId }).count(),
    db.offline_audio_queue.where({ status: 'pending', userId }).count(),
    db.wallet_transactions.where({ sync_status: 'pending', userId }).count(),
    db.receipts.where({ sync_status: 'pending', userId }).count(),
    db.court_diary.where({ sync_status: 'pending', userId }).count(),
    db.trust_transactions.where({ sync_status: 'pending', userId }).count(),
    db.case_records.where({ sync_status: 'pending', userId }).count(),
  ]);
  return txn + notes + audio + wallet + receipts + diary + trust + cases;
}
```

**Step 5: Update clearUserLocalData (around line 118)**

Add the 3 new tables:

```typescript
export async function clearUserLocalData(userId: string): Promise<void> {
  await Promise.all([
    db.transactions.where({ userId }).delete(),
    db.clinical_notes.where({ userId }).delete(),
    db.offline_audio_queue.where({ userId }).delete(),
    db.wallet_transactions.where({ userId }).delete(),
    db.receipts.where({ userId }).delete(),
    db.court_diary.where({ userId }).delete(),
    db.trust_transactions.where({ userId }).delete(),
    db.case_records.where({ userId }).delete(),
  ]);
}
```

**Step 6: Verify file compiles**

Run: `npx tsc --noEmit src/lib/db.ts`
Expected: No errors.

**Step 7: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat(legal): add court_diary, trust_transactions, case_records Dexie tables (v2 migration)"
```

---

## Task 3: Update Profession Routes — LexTracksy Branding

**Files:**
- Modify: `src/config/professionRoutes.ts` (lines 26-33)

**Step 1: Update the legal profession entry**

Change lines 26-33 from:

```typescript
    {
        slug: 'legal',
        profession: 'legal',
        name: 'MyTracksy Legal',
        shortName: 'Legal Tracksy',
        icon: '⚖️',
        themeColor: '#6366f1',
        description: 'Legal practice management — Cases, billing, client tracking',
    },
```

To:

```typescript
    {
        slug: 'legal',
        profession: 'legal',
        name: 'LexTracksy',
        shortName: 'LexTracksy',
        icon: '⚖️',
        themeColor: '#0f172a',
        description: 'AI-Powered Legal Practice Management for Sri Lankan Attorneys-at-Law',
        dedicatedPwa: true,
    },
```

**Step 2: Verify**

Run: `npx tsc --noEmit src/config/professionRoutes.ts`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/config/professionRoutes.ts
git commit -m "feat(legal): rebrand legal profession to LexTracksy with dedicated PWA flag"
```

---

## Task 4: Create LawyerLandingPage.tsx

**Files:**
- Create: `src/components/LawyerLandingPage.tsx`

This is the largest task. The component follows the exact pattern of `DoctorLandingPage.tsx`:
- Props: `{ onGetStarted, onLogin, onBack }`
- State: `navSolid` (scroll-based nav), `billingCycle` (annual/monthly toggle)
- Effects: scroll listener, IntersectionObserver for `.sr` class scroll-reveal
- Helmet for SEO metadata
- Inline CSS styles (no Tailwind)

**Step 1: Create LawyerLandingPage.tsx with full implementation**

The component must include these 6 sections:

### A. Fixed Navigation Bar
- Logo: "LexTracksy" with ⚖️ icon
- Nav links: Features, AI Tools, Security, Pricing
- CTA button: "Start Free Trial"
- Transparent → solid on scroll (same as Doctor page)

### B. Hero Section
- Background: Navy blue (`#0f172a`) with gold (`#f59e0b`) accent glows
- Headline: "You Mastered the Law. Let AI Master Your Chambers."
- Sub-headline: "Manage Court Diaries, automate Client Trust Accounting, and draft legal documents with AI engineered for Sri Lankan Attorneys."
- Two CTAs: "Start 14-Day Free Trial" (gold) + "Watch Demo" (outline)

### C. Features Grid (3 columns)
1. Smart Court Diary — "Detects clashes between Hulftsdorp and Outstation courts. Instant Conflict of Interest checks."
2. Trust & Retainer Ledger — "Stop mixing client retainers with your operating income. Generate 1-Click PDF Fee Notes to recover out-of-pocket court stamps."
3. AI Case Minutes — "Speak your case updates in English or Sinhala as you walk out of the courtroom. The AI formats it and updates your diary offline."

### D. Elite AI Add-Ons Section
- Generate Letters of Demand in seconds
- Extract Title Details from 50-year-old faded deeds using Vision AI
- Summarize Supreme Court Judgments
- Each with "Coming Soon" pill badge

### E. Security Banner
- "Bank-Grade AES-256 Encryption"
- "Strict Attorney-Client Privilege Protocols"
- "100% Compliant with Sri Lanka PDPA No. 9 of 2022"

### F. Pricing Section
- Monthly/Annual toggle (same pattern as Doctor page)
- 3 tier cards using data from `getPricingForProfession('legal')`
- Import and use pricingConfig.ts
- AI Token Store callout: "LKR 1,500 for 100 Tokens"

### G. Footer
- Links: Terms, Privacy, PDPA
- Credit: "Designed & Engineered by SafeNet Creations" → https://safenetcreations.com

### H. Theme Constants
```typescript
const NAVY = '#0f172a';      // slate-950
const NAVY_LIGHT = '#1e293b'; // slate-800
const GOLD = '#f59e0b';       // amber-500
const GOLD_DARK = '#d97706';  // amber-600
const WHITE = '#ffffff';
const GRAY_100 = '#f1f5f9';
const GRAY_400 = '#94a3b8';
```

### I. Fonts
- Headings: `'Playfair Display', Georgia, serif`
- Body: `'Inter', 'Plus Jakarta Sans', system-ui, sans-serif`
- Add Google Fonts link in Helmet

### J. SEO (Helmet)
```html
<title>LexTracksy | AI Legal Practice Management for Sri Lankan Attorneys</title>
<meta name="description" content="AI-powered legal practice management for Sri Lankan Attorneys-at-Law. Smart Court Diary, Trust Accounting, Voice Case Minutes. PDPA compliant." />
<link rel="canonical" href="https://mytracksy.lk/legal" />
<!-- JSON-LD Organization schema -->
```

**Step 2: Verify**

Run: `npx tsc --noEmit src/components/LawyerLandingPage.tsx`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/LawyerLandingPage.tsx
git commit -m "feat(legal): create LawyerLandingPage with premium Navy/Gold theme, 3-tier pricing, SEO"
```

---

## Task 5: Wire LawyerLandingPage into ProfessionLandingPage Router

**Files:**
- Modify: `src/components/ProfessionLandingPage.tsx` (lines 1-6 and 225-232)

**Step 1: Add import (line 5, after CreatorLandingPage import)**

```typescript
import LawyerLandingPage from './LawyerLandingPage';
```

**Step 2: Add slug switch (after line 232, after the creator check)**

Insert after the creator `if` block:

```typescript
    // Lawyer gets a fully custom landing page
    if (slug === 'legal') {
        return <LawyerLandingPage onGetStarted={onGetStarted} onLogin={onLogin} onBack={onBack} />;
    }
```

**Step 3: Verify**

Run: `npx tsc --noEmit src/components/ProfessionLandingPage.tsx`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/components/ProfessionLandingPage.tsx
git commit -m "feat(legal): wire LawyerLandingPage into ProfessionLandingPage slug router"
```

---

## Task 6: Rewrite LegalDashboard.tsx — Complete Dashboard

**Files:**
- Modify: `src/components/dashboards/LegalDashboard.tsx` (complete rewrite)

This is the second-largest task. The existing file is completely replaced.

### Props (unchanged)
```typescript
interface LegalDashboardProps {
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}
```

### Navigation Tabs (9 tabs)
```typescript
const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'diary', label: 'Court Diary', icon: '📅' },
    { id: 'cases', label: 'Cases & Clients', icon: '📁' },
    { id: 'trust', label: 'Trust Accounting', icon: '🏦' },
    { id: 'ai', label: 'AI Tools', icon: '🤖' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'billing', label: 'Billing', icon: '💰' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];
```

### Key Sections to Implement

#### A. Overview Tab (Dashboard Home)
- **Trust vs Operating Dual-Wallet** at top:
  - Left Card (gray): "Client Retainers Held in Trust" — total from `trust_transactions` where `account === 'trust'`
  - Right Card (green): "My Taxable Operating Income" — total from `trust_transactions` where `account === 'operating'`
  - Action Row: "Log Appearance Fee" + "Log Out-of-Pocket Expense" buttons
- **Today's Court Diary** mini-list (next 3 hearings)
- **Active Cases** count
- **Token Balance** badge

#### B. Court Diary Tab
- Full list from `court_diary` Dexie table via `useLiveQuery`
- Each entry: case number, court name, court number, time, judge, hearing type
- **Conflict Detection**: If same date has entries in different court locations (hulftsdorp + outstation), show red alert: "⚠️ Travel Conflict Detected"
- Add New Hearing form/modal
- Date filter

#### C. Cases & Clients Tab
- List from `case_records` Dexie table via `useLiveQuery`
- Each card: case title, case number, client, court, type badge, status badge
- Retainer balance per case
- Add New Case form/modal

#### D. Trust Accounting Tab
- Transaction list from `trust_transactions` via `useLiveQuery`
- Split view: Trust column vs Operating column
- Action buttons: "Log Appearance Fee", "Log Court Stamp", "Log Typist Fee", "Receive Retainer"
- "Generate Fee Note PDF" button (placeholder — logs message for now)

#### E. AI Tools Tab (Grid of 3 coming-soon cards)
- "Draft Letter of Demand (1 Token)" — Coming Soon badge
- "Summarize SLR Judgment (5 Tokens)" — Coming Soon badge
- "Extract Faded Deed Data (3 Tokens)" — Coming Soon badge
- Token balance: "45 Tokens" badge in header

#### F. FAB Voice Recorder
- Fixed position bottom-right, always visible on all tabs
- Large microphone icon with pulsing animation when recording
- `navigator.wakeLock.request('screen')` while recording
- Records to `offline_audio_queue` in Dexie with `purpose: 'clinical_note'`
- Simple start/stop toggle

#### G. Settings Tab
- Professional fields:
  - BASL Registration Number
  - Notary Public License Number
  - Professional Indemnity Insurance
  - IRD TIN Number

#### H. Currency Formatting
All amounts use:
```typescript
const formatLKR = (amount: number) =>
  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
```

#### I. Sample Data (for initial display when tables are empty)
- 5 sample cases (Civil, Criminal, Corporate, Estate, IP Law)
- Court calendar with Colombo, Kandy, Gampaha courts
- Legal expense categories (Office Rent, Staff & Clerks, Court Fees, Research, Travel, BASL, Supplies, Insurance)
- Bank accounts: Legal Practice A/C, Client Trust A/C, Savings

### Dexie Integration Pattern
```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../lib/db';

// Inside component:
const courtDiary = useLiveQuery(
  () => db.court_diary.where({ userId }).toArray(),
  [userId]
);
const trustTransactions = useLiveQuery(
  () => db.trust_transactions.where({ userId }).toArray(),
  [userId]
);
const caseRecords = useLiveQuery(
  () => db.case_records.where({ userId }).toArray(),
  [userId]
);
```

**Step 2: Verify**

Run: `npx tsc --noEmit src/components/dashboards/LegalDashboard.tsx`
Expected: No errors.

**Step 3: Build test**

Run: `npx vite build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/dashboards/LegalDashboard.tsx
git commit -m "feat(legal): complete LegalDashboard rewrite with Trust wallet, Court Diary, AI tools, FAB recorder"
```

---

## Task 7: Update SubscriptionManager for Multi-Profession Pricing

**Files:**
- Modify: `src/components/SubscriptionManager.tsx`

**Step 1: Update SubData interface (line 6-7)**

Change:
```typescript
interface SubData {
    tier: 'free' | 'pro';
```

To:
```typescript
interface SubData {
    tier: 'free' | 'pro' | 'chambers';
```

**Step 2: Import pricing config**

Add at top:
```typescript
import { getPricingForProfession, PricingTier } from '../config/pricingConfig';
```

**Step 3: Get profession from auth context or props**

The component needs to know which profession to show pricing for. Add a prop or read from context:
```typescript
// Read stored profession
const storedProfession = localStorage.getItem('myTracksyProfession');
const profession = storedProfession ? JSON.parse(storedProfession)?.profession : 'medical';
const pricing = getPricingForProfession(profession);
```

**Step 4: Replace hardcoded pricing with dynamic rendering**

Replace the hardcoded 2-tier card layout with a dynamic loop over `pricing.tiers`:
```typescript
{pricing.tiers.map((tier: PricingTier) => (
  <div key={tier.id} style={{ /* card styles */ }}>
    <h3>{tier.name}</h3>
    <p>{tier.monthlyPrice === 0 ? 'Free' : `LKR ${tier.monthlyPrice.toLocaleString()}/mo`}</p>
    <ul>
      {tier.features.map((f, i) => <li key={i}>{f}</li>)}
    </ul>
    {tier.badge && <span>{tier.badge}</span>}
  </div>
))}
```

**Step 5: Replace hardcoded SLMC field with profession-specific fields**

For medical: show SLMC Registration Number
For legal: show BASL Registration Number
For others: show generic Professional ID

```typescript
const professionalIdLabel = profession === 'medical' ? 'SLMC Registration Number'
  : profession === 'legal' ? 'BASL Registration Number'
  : 'Professional Registration Number';
```

**Step 6: Verify**

Run: `npx tsc --noEmit src/components/SubscriptionManager.tsx`
Expected: No errors.

**Step 7: Full build test**

Run: `npx vite build`
Expected: Build succeeds with no errors.

**Step 8: Commit**

```bash
git add src/components/SubscriptionManager.tsx
git commit -m "feat(legal): make SubscriptionManager profession-aware with dynamic tier rendering"
```

---

## Task 8: Final Integration Test & Verify

**Step 1: Full build**

Run: `npx vite build`
Expected: Clean build, no errors or warnings.

**Step 2: Manual verification checklist**

- [ ] Navigate to `/legal` → LawyerLandingPage renders (not generic)
- [ ] Navy/Gold theme visible in landing page
- [ ] Pricing section shows 3 tiers (Junior Counsel, Independent Counsel, Chambers)
- [ ] Monthly/Annual toggle works
- [ ] Login from `/legal` → redirects to LegalDashboard
- [ ] LegalDashboard shows Trust/Operating wallet cards
- [ ] Court Diary tab loads (empty state or sample data)
- [ ] AI Tools tab shows 3 "Coming Soon" cards
- [ ] FAB voice recorder button is visible
- [ ] Settings tab shows BASL and Notary fields
- [ ] SubscriptionManager shows legal-specific tiers when accessed from legal profession
- [ ] `IndexedDB` → `MyTracksyLocalDB` → tables include `court_diary`, `trust_transactions`, `case_records`

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(legal): LexTracksy complete — landing page, dashboard, pricing, Dexie tables"
```

---

## Execution Order Summary

| # | Task | Depends On | Est. Size |
|---|------|-----------|-----------|
| 1 | pricingConfig.ts | None | Small |
| 2 | Dexie DB v2 migration | None | Medium |
| 3 | professionRoutes update | None | Small |
| 4 | LawyerLandingPage.tsx | Task 1 (imports pricing) | Large |
| 5 | ProfessionLandingPage router | Task 4 | Small |
| 6 | LegalDashboard.tsx rewrite | Task 2 (uses Dexie tables) | Large |
| 7 | SubscriptionManager update | Task 1 (imports pricing) | Medium |
| 8 | Integration test & verify | All above | Small |

**Tasks 1, 2, 3 can run in parallel** (no dependencies).
**Task 4 depends on Task 1** (imports pricingConfig).
**Task 5 depends on Task 4** (imports LawyerLandingPage).
**Task 6 depends on Task 2** (uses new Dexie tables).
**Task 7 depends on Task 1** (imports pricingConfig).
**Task 8 depends on all** (integration verification).
