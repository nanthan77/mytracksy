# LegalDashboard Production Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring LegalDashboard.tsx to full production parity with MedicalDashboard.tsx + add document templates, calendar sync, and WhatsApp integration.

**Architecture:** Complete rewrite of LegalDashboard.tsx following MedicalDashboard's proven patterns — useAuth() for auth, accountingCoreService for Firestore persistence, useTokenWallet() for monetization, useIsCompactMobile() + mobileShell for PWA mobile, BiometricGate/SubscriptionGate for security, VoiceInput for AI voice, plus 3 new legal-specific services (document templates, calendar export, WhatsApp deep links).

**Tech Stack:** React 18, TypeScript, Firebase (Auth + Firestore + Storage), Dexie (IndexedDB), Material UI 5, jsPDF, iCalendar (.ics)

---

## Task 1: Add `clientPhone` and `clientEmail` to CaseRecord in db.ts

**Files:**
- Modify: `src/lib/db.ts` (CaseRecord interface, around line 119-135)

**Step 1: Add fields to CaseRecord interface**

In `src/lib/db.ts`, find the `CaseRecord` interface and add two optional fields:

```typescript
export interface CaseRecord {
  id?: number;
  clientName: string;
  clientPhone?: string;    // NEW — for WhatsApp integration
  clientEmail?: string;    // NEW — for document delivery
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

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -c "db.ts"` — expected: 0 errors

**Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat(legal): add clientPhone and clientEmail to CaseRecord for WhatsApp/document delivery"
```

---

## Task 2: Create WhatsApp Service

**Files:**
- Create: `src/services/whatsappService.ts`

**Step 1: Create the service**

```typescript
// src/services/whatsappService.ts
// WhatsApp deep link generator for legal client communications

export interface WhatsAppMessage {
  phone: string;       // International format: 94771234567
  message: string;
}

/**
 * Format a Sri Lankan phone number for WhatsApp.
 * Accepts: 0771234567, +94771234567, 94771234567, 077-123-4567
 * Returns: 94771234567
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Strip all non-digits
  let cleaned = phone.replace(/\D/g, '');
  // If starts with 0, replace with 94 (Sri Lanka country code)
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.slice(1);
  }
  // If doesn't start with country code, prepend 94
  if (!cleaned.startsWith('94')) {
    cleaned = '94' + cleaned;
  }
  return cleaned;
}

/**
 * Generate a WhatsApp deep link URL.
 * Opens WhatsApp with a pre-filled message to the given phone number.
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Generate a hearing reminder message for a client.
 */
export function hearingReminderMessage(params: {
  clientName: string;
  caseTitle: string;
  court: string;
  courtNo: string;
  date: string;
  time: string;
  hearingType: string;
}): string {
  const { clientName, caseTitle, court, courtNo, date, time, hearingType } = params;
  const formattedDate = new Date(date).toLocaleDateString('en-LK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  return `Dear ${clientName},\n\nThis is a reminder that your case "${caseTitle}" is listed for ${hearingType} at ${court}, Court No. ${courtNo} on ${formattedDate} at ${time}.\n\nPlease ensure your attendance.\n\nRegards,\nYour Legal Team`;
}

/**
 * Generate a case update message.
 */
export function caseUpdateMessage(params: {
  clientName: string;
  caseTitle: string;
  update: string;
}): string {
  return `Dear ${params.clientName},\n\nUpdate on your case "${params.caseTitle}":\n\n${params.update}\n\nRegards,\nYour Legal Team`;
}

/**
 * Generate a fee note / invoice message.
 */
export function feeNoteMessage(params: {
  clientName: string;
  caseTitle: string;
  amount: number;
  description: string;
}): string {
  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency: 'LKR'
  }).format(params.amount);
  return `Dear ${params.clientName},\n\nA fee note of ${formattedAmount} has been raised for your case "${params.caseTitle}".\n\nDetails: ${params.description}\n\nPlease arrange payment at your earliest convenience.\n\nRegards,\nYour Legal Team`;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep whatsapp` — expected: no errors

**Step 3: Commit**

```bash
git add src/services/whatsappService.ts
git commit -m "feat(legal): add WhatsApp deep link service for client communications"
```

---

## Task 3: Create Calendar Export Service

**Files:**
- Create: `src/services/calendarExportService.ts`

**Step 1: Create the service**

```typescript
// src/services/calendarExportService.ts
// iCalendar (.ics) export for court diary entries

import type { CourtDiaryEntry } from '../lib/db';

/**
 * Generate an iCalendar (.ics) string for one or more court diary entries.
 * Compatible with Google Calendar, Apple Calendar, Outlook.
 */
export function generateICS(entries: CourtDiaryEntry[], lawyerName?: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LexTracksy//Court Diary//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const entry of entries) {
    const dtStart = formatICSDateTime(entry.date, entry.time);
    // Default 1-hour duration
    const dtEnd = formatICSDateTime(entry.date, entry.time, 60);
    const uid = `court-${entry.id || Date.now()}-${entry.date}@lextracksy.app`;
    const summary = escapeICS(`${entry.hearingType.toUpperCase()} — ${entry.caseTitle || entry.caseId}`);
    const location = escapeICS(`${entry.court}, Court No. ${entry.courtNo}`);
    const description = escapeICS(
      `Judge: ${entry.judge}\\n` +
      `Hearing: ${entry.hearingType}\\n` +
      `Status: ${entry.status}\\n` +
      (entry.notes ? `Notes: ${entry.notes}\\n` : '') +
      (lawyerName ? `Attorney: ${lawyerName}` : '')
    );

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      `STATUS:${entry.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      // Alarm: 1 day before
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Court hearing tomorrow — ${entry.caseTitle || entry.caseId}`,
      'END:VALARM',
      // Alarm: 1 hour before
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Court hearing in 1 hour — ${entry.caseTitle || entry.caseId}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Download an .ics file to the user's device.
 */
export function downloadICS(entries: CourtDiaryEntry[], filename?: string, lawyerName?: string): void {
  const icsContent = generateICS(entries, lawyerName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `court-diary-${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download a single diary entry as .ics.
 */
export function downloadSingleEntryICS(entry: CourtDiaryEntry, lawyerName?: string): void {
  const safeName = (entry.caseTitle || entry.caseId || 'hearing').replace(/[^a-zA-Z0-9]/g, '-');
  downloadICS([entry], `${safeName}-${entry.date}.ics`, lawyerName);
}

// ── Helpers ──

function formatICSDateTime(date: string, time: string, addMinutes = 0): string {
  // date: "2026-03-15", time: "09:30"
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const d = new Date(year, month - 1, day, hour, minute);
  if (addMinutes > 0) d.setMinutes(d.getMinutes() + addMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep calendar` — expected: no errors

**Step 3: Commit**

```bash
git add src/services/calendarExportService.ts
git commit -m "feat(legal): add iCalendar (.ics) export service for court diary"
```

---

## Task 4: Create Legal Document Template Service

**Files:**
- Create: `src/services/legalDocumentService.ts`

**Step 1: Create the service**

```typescript
// src/services/legalDocumentService.ts
// Legal document template engine for Sri Lankan legal practice
// Generates Fee Notes, POAs, and other documents as structured data for PDF export

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'fee_note' | 'poa' | 'plaint' | 'bail_application' | 'deed' | 'nda' | 'letter';
  description: string;
  fields: TemplateField[];
}

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];   // For 'select' type
  defaultValue?: string;
}

export interface GeneratedDocument {
  title: string;
  type: string;
  content: string;      // Formatted text content
  date: string;
  caseRef?: string;
  clientName?: string;
  totalAmount?: number;
}

// ── Fee Note Line Item ──
export interface FeeNoteItem {
  description: string;
  amount: number;
}

// ── Available Templates ──
export const LEGAL_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'fee_note',
    name: 'Fee Note',
    type: 'fee_note',
    description: 'Professional fee note for legal services rendered',
    fields: [
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'clientAddress', label: 'Client Address', type: 'textarea', required: false },
      { key: 'caseTitle', label: 'Case Reference', type: 'text', required: true },
      { key: 'court', label: 'Court', type: 'text', required: false },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'notes', label: 'Additional Notes', type: 'textarea', required: false },
    ],
  },
  {
    id: 'poa',
    name: 'Power of Attorney',
    type: 'poa',
    description: 'General or Special Power of Attorney',
    fields: [
      { key: 'grantor', label: 'Grantor (Principal)', type: 'text', required: true },
      { key: 'grantorAddress', label: 'Grantor Address', type: 'textarea', required: true },
      { key: 'grantorNIC', label: 'Grantor NIC Number', type: 'text', required: true },
      { key: 'attorney', label: 'Attorney-in-Fact', type: 'text', required: true },
      { key: 'attorneyAddress', label: 'Attorney Address', type: 'textarea', required: true },
      { key: 'attorneyNIC', label: 'Attorney NIC Number', type: 'text', required: true },
      { key: 'poaType', label: 'Type', type: 'select', required: true, options: ['General', 'Special'] },
      { key: 'powers', label: 'Powers Granted', type: 'textarea', required: true, placeholder: 'Describe the specific powers being granted...' },
      { key: 'date', label: 'Date', type: 'date', required: true },
    ],
  },
  {
    id: 'bail_application',
    name: 'Bail Application',
    type: 'bail_application',
    description: 'Application for bail in criminal proceedings',
    fields: [
      { key: 'accusedName', label: 'Name of Accused', type: 'text', required: true },
      { key: 'accusedAddress', label: 'Address of Accused', type: 'textarea', required: true },
      { key: 'caseNumber', label: 'Case Number', type: 'text', required: true },
      { key: 'court', label: 'Court', type: 'text', required: true },
      { key: 'offence', label: 'Offence Charged', type: 'text', required: true },
      { key: 'grounds', label: 'Grounds for Bail', type: 'textarea', required: true, placeholder: 'List the grounds supporting the bail application...' },
      { key: 'suretyName', label: 'Surety Name', type: 'text', required: false },
      { key: 'suretyAddress', label: 'Surety Address', type: 'textarea', required: false },
      { key: 'date', label: 'Date', type: 'date', required: true },
    ],
  },
  {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    type: 'nda',
    description: 'Mutual or one-way confidentiality agreement',
    fields: [
      { key: 'partyA', label: 'Disclosing Party', type: 'text', required: true },
      { key: 'partyB', label: 'Receiving Party', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose of Disclosure', type: 'textarea', required: true },
      { key: 'duration', label: 'Duration (years)', type: 'number', required: true },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: true, defaultValue: 'Sri Lanka' },
      { key: 'date', label: 'Effective Date', type: 'date', required: true },
    ],
  },
  {
    id: 'letter',
    name: 'Legal Letter / Notice',
    type: 'letter',
    description: 'Formal legal letter or notice to a party',
    fields: [
      { key: 'recipientName', label: 'Recipient Name', type: 'text', required: true },
      { key: 'recipientAddress', label: 'Recipient Address', type: 'textarea', required: true },
      { key: 'subject', label: 'Subject / Re', type: 'text', required: true },
      { key: 'body', label: 'Letter Body', type: 'textarea', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
    ],
  },
];

/**
 * Generate a fee note document from line items.
 */
export function generateFeeNote(params: {
  clientName: string;
  clientAddress?: string;
  caseTitle: string;
  court?: string;
  date: string;
  items: FeeNoteItem[];
  notes?: string;
  lawyerName: string;
}): GeneratedDocument {
  const { clientName, clientAddress, caseTitle, court, date, items, notes, lawyerName } = params;
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const formattedTotal = new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(total);

  const itemLines = items.map((item, i) =>
    `${i + 1}. ${item.description} — LKR ${item.amount.toLocaleString('en-LK')}`
  ).join('\n');

  const content = [
    `FEE NOTE`,
    ``,
    `To: ${clientName}`,
    clientAddress ? `Address: ${clientAddress}` : '',
    `Date: ${new Date(date).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Case: ${caseTitle}`,
    court ? `Court: ${court}` : '',
    ``,
    `Professional fees for services rendered:`,
    ``,
    itemLines,
    ``,
    `TOTAL: ${formattedTotal}`,
    ``,
    notes ? `Notes: ${notes}` : '',
    ``,
    `${lawyerName}`,
    `Attorney-at-Law`,
  ].filter(Boolean).join('\n');

  return { title: `Fee Note — ${clientName}`, type: 'fee_note', content, date, caseRef: caseTitle, clientName, totalAmount: total };
}

/**
 * Get a template by ID.
 */
export function getTemplate(templateId: string): DocumentTemplate | undefined {
  return LEGAL_TEMPLATES.find(t => t.id === templateId);
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep legalDocument` — expected: no errors

**Step 3: Commit**

```bash
git add src/services/legalDocumentService.ts
git commit -m "feat(legal): add document template engine for fee notes, POA, bail, NDA"
```

---

## Task 5: Rewrite LegalDashboard.tsx — Full Production Parity + New Features

This is the main task. The existing 1,071-line file gets a complete rewrite to ~1,800+ lines following MedicalDashboard patterns exactly.

**Files:**
- Rewrite: `src/components/dashboards/LegalDashboard.tsx`

**Step 1: Write the complete rewrite**

The rewrite must include ALL of the following (in order):

**A. Imports** — Mirror MedicalDashboard imports:
```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { CourtDiaryEntry, TrustTransaction, CaseRecord } from '../../lib/db';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import InvoiceForm, { InvoiceData } from './InvoiceForm';
import VoiceInput, { ParsedVoiceAction } from '../VoiceInput';
import TaxSpeedometer from '../TaxSpeedometer';
import ReceiptScanner from '../ReceiptScanner';
import AuditorExport from '../AuditorExport';
import TransactionInbox from '../TransactionInbox';
import AIVoiceVault from '../AIVoiceVault';
import MorningBriefing from '../MorningBriefing';
import SmartScheduler from '../SmartScheduler';
import LifeAdmin from '../LifeAdmin';
import BiometricGate from '../BiometricGate';
import SubscriptionGate from '../SubscriptionGate';
import SubscriptionManager from '../SubscriptionManager';
import { GOLDEN_LIST, getCategoryByName, isCapitalItem } from '../../config/goldenListCategories';
import { useAuth } from '../../context/AuthContext';
import { useTokenWallet, TOKEN_PACKAGES, TokenPackage } from '../../hooks/useTokenWallet';
import { addTransaction, subscribeTransactions, seedChartOfAccounts, toCents, fromCents } from '../../services/accountingCoreService';
import { useIsCompactMobile } from './useIsCompactMobile';
import { generateWhatsAppLink, hearingReminderMessage, caseUpdateMessage, feeNoteMessage, formatPhoneForWhatsApp } from '../../services/whatsappService';
import { downloadSingleEntryICS, downloadICS } from '../../services/calendarExportService';
import { LEGAL_TEMPLATES, generateFeeNote, FeeNoteItem } from '../../services/legalDocumentService';
```

**B. Navigation items** — Expand from 9 to 20:
```typescript
const navItems = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'briefing', label: 'Court Day Briefing', icon: '🌅', premium: true },
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'diary', label: 'Court Diary', icon: '📅' },
  { id: 'cases', label: 'Cases & Clients', icon: '📁' },
  { id: 'trust', label: 'Trust Accounting', icon: '🏦' },
  { id: 'income', label: 'Income & Fee Notes', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'tax', label: 'Tax & IRD', icon: '🧾' },
  { id: 'receipts', label: 'Receipts', icon: '📸' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'reports', label: 'Reports', icon: '📋' },
  { id: 'export', label: 'Auditor Export', icon: '📦' },
  { id: 'ai', label: 'AI Tools', icon: '🤖' },
  { id: 'voicevault', label: 'Voice Vault', icon: '🎙️', premium: true },
  { id: 'scheduler', label: 'Smart Scheduler', icon: '📅', premium: true },
  { id: 'lifeadmin', label: 'Life Admin', icon: '📋', premium: true },
  { id: 'wallet', label: 'Token Wallet', icon: '🪙' },
  { id: 'subscription', label: 'Subscription', icon: '⭐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];
```

**C. Mobile tab system** — 5 legal-specific groups:
```typescript
type LegalMobileTabId = 'home' | 'court' | 'cases' | 'money' | 'more';

const LEGAL_MOBILE_TABS: { id: LegalMobileTabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'court', label: 'Court', icon: '⚖️' },
  { id: 'cases', label: 'Cases', icon: '📁' },
  { id: 'money', label: 'Money', icon: '💳' },
  { id: 'more', label: 'More', icon: '☰' },
];

const LEGAL_MOBILE_GROUPS: Record<LegalMobileTabId, string[]> = {
  home: ['overview', 'inbox'],
  court: ['diary', 'briefing', 'scheduler', 'documents'],
  cases: ['cases', 'trust', 'ai', 'voicevault'],
  money: ['income', 'expenses', 'tax', 'reports', 'export', 'wallet'],
  more: ['receipts', 'lifeadmin', 'subscription', 'settings'],
};

const LEGAL_MOBILE_DEFAULT_NAV: Record<LegalMobileTabId, string> = {
  home: 'overview',
  court: 'diary',
  cases: 'cases',
  money: 'income',
  more: 'settings',
};

const LEGAL_SHORTCUT_NAV: Record<string, string> = {
  overview: 'overview', diary: 'diary', cases: 'cases', trust: 'trust',
  income: 'income', expenses: 'expenses', reports: 'reports', receipts: 'receipts',
};

function getLegalMobileTab(activeNav: string): LegalMobileTabId {
  const match = LEGAL_MOBILE_TABS.find(tab => LEGAL_MOBILE_GROUPS[tab.id].includes(activeNav));
  return match?.id || 'home';
}
```

**D. Component body** — Use hooks like MedicalDashboard:
```typescript
const { currentUser } = useAuth();
const uid = currentUser?.uid;
const walletData = useTokenWallet(uid || '');
const isCompactMobile = useIsCompactMobile();
```

**E. Firestore subscriptions** — Same useEffect pattern:
```typescript
useEffect(() => {
  if (!uid) return;
  seedChartOfAccounts(uid, 'legal').catch(err => console.error('Failed to seed CoA:', err));
}, [uid]);

useEffect(() => {
  if (!uid) return;
  const unsubIncome = subscribeTransactions(uid, (txns) => {
    if (txns.length > 0) {
      setInvoices(txns.map(t => ({
        id: t.id || '', type: 'income' as const,
        amount: fromCents(t.amount_cents), description: t.description,
        category: t.category_name || '', date: t.date,
        status: (t.status === 'cleared' ? 'paid' : 'pending') as any,
      })));
    }
  }, { type: 'income', status: 'cleared' });

  const unsubExpenses = subscribeTransactions(uid, (txns) => {
    if (txns.length > 0) {
      setExpenses(txns.map(t => ({
        id: t.id || '', type: 'expense' as const,
        amount: fromCents(t.amount_cents), description: t.description,
        category: t.category_name || '', date: t.date, status: 'completed',
      })));
    }
  }, { type: 'expense', status: 'cleared' });

  return () => { unsubIncome(); unsubExpenses(); };
}, [uid]);
```

**F. Keep existing Dexie queries** for court diary, trust, cases (they work):
```typescript
const courtDiary = useLiveQuery(
  () => uid ? db.court_diary.where({ userId: uid }).toArray() : [],
  [uid],
) || [];
// ... same for trustTransactions, caseRecords
```

**G. BiometricGate / SubscriptionGate** — Wrap sensitive tabs:
```typescript
case 'trust': return <BiometricGate sectionName="Trust Accounting" sectionIcon="🏦">{renderTrust()}</BiometricGate>;
case 'income': return <BiometricGate sectionName="Income & Fee Notes" sectionIcon="💰">{renderIncome()}</BiometricGate>;
case 'voicevault': return (
  <BiometricGate sectionName="Voice Vault" sectionIcon="🎙️">
    <SubscriptionGate featureName="AI Voice Vault" featureIcon="🎙️">
      <AIVoiceVault />
    </SubscriptionGate>
  </BiometricGate>
);
case 'briefing': return (
  <SubscriptionGate featureName="Court Day Briefing" featureIcon="🌅">
    <MorningBriefing />
  </SubscriptionGate>
);
```

**H. VoiceInput** — Legal-specific voice handler:
```typescript
const handleVoiceAction = (action: ParsedVoiceAction) => {
  const dateStr = new Date().toISOString().split('T')[0];
  switch (action.intent) {
    case 'income': {
      const t: Transaction = { id: `v-${Date.now()}`, type: 'income', amount: action.amount || 0,
        description: action.description || 'Voice entry', category: action.category || 'Appearance Fee', date: dateStr, status: 'paid' };
      setInvoices(prev => [t, ...prev]);
      break;
    }
    case 'expense': {
      const t: Transaction = { id: `v-${Date.now()}`, type: 'expense', amount: action.amount || 0,
        description: action.description || 'Voice entry', category: action.category || 'Court Fees', date: dateStr, status: 'completed' };
      setExpenses(prev => [t, ...prev]);
      break;
    }
    case 'appointment': setActiveNav('diary'); break;
    default: break;
  }
};
```

**I. mobileShell prop + VoiceInput render** — At bottom of component:
```typescript
return (
  <>
    <DashboardLayout
      profession="legal"
      professionLabel="LexTracksy"
      professionIcon="⚖️"
      userName={userName}
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={setActiveNav}
      onChangeProfession={onChangeProfession}
      onLogout={onLogout}
      tokenBalance={walletData.tokenBalance}
      onWalletClick={() => setActiveNav('wallet')}
      mobileShell={{
        enabled: true,
        tabs: LEGAL_MOBILE_TABS,
        activeTab: activeMobileTab,
        onTabChange: handleMobileTabChange,
        activeTitle: activeNavItem.label,
        activeSubtitle: `${currentDateLabel} • ${userName}`,
      }}
    >
      <>
        {renderMobileSectionNav()}
        {renderContent()}
      </>
    </DashboardLayout>
    {showInvoiceForm && <InvoiceForm onSubmit={handleCreateInvoice} onCancel={() => setShowInvoiceForm(false)} />}
    <VoiceInput onAction={handleVoiceAction} position="float"
      floatingOffset={isCompactMobile ? { bottom: 114, right: 16 } : undefined} />
  </>
);
```

**J. Responsive helper** — Same as Medical:
```typescript
const gridColumns = (desktop: string, mobile = '1fr') => isCompactMobile ? mobile : desktop;
const stackGap = isCompactMobile ? '0.85rem' : '1rem';
```

**K. renderContent switch** — All 20 tabs:
```typescript
const renderContent = () => {
  switch (activeNav) {
    case 'overview': return renderOverview();
    case 'briefing': return <SubscriptionGate featureName="Court Day Briefing" featureIcon="🌅"><MorningBriefing /></SubscriptionGate>;
    case 'inbox': return <TransactionInbox />;
    case 'diary': return renderDiary();           // KEEP existing — already works with Dexie
    case 'cases': return renderCases();           // KEEP existing — already works with Dexie
    case 'trust': return <BiometricGate sectionName="Trust Accounting" sectionIcon="🏦">{renderTrust()}</BiometricGate>;
    case 'income': return <BiometricGate sectionName="Income & Fee Notes" sectionIcon="💰">{renderIncome()}</BiometricGate>;
    case 'expenses': return <BiometricGate sectionName="Expenses" sectionIcon="💸">{renderExpenses()}</BiometricGate>;
    case 'tax': return <TaxSpeedometer />;
    case 'receipts': return <ReceiptScanner />;
    case 'documents': return renderDocuments();    // UPGRADE — template engine
    case 'reports': return renderReports();        // UPGRADE — P&L + tax summary
    case 'export': return <AuditorExport />;
    case 'ai': return renderAI();                  // KEEP existing
    case 'voicevault': return <BiometricGate sectionName="Voice Vault" sectionIcon="🎙️"><SubscriptionGate featureName="AI Voice Vault" featureIcon="🎙️"><AIVoiceVault /></SubscriptionGate></BiometricGate>;
    case 'scheduler': return <SubscriptionGate featureName="Smart Scheduler" featureIcon="📅"><SmartScheduler /></SubscriptionGate>;
    case 'lifeadmin': return <SubscriptionGate featureName="Life Admin" featureIcon="📋"><LifeAdmin /></SubscriptionGate>;
    case 'wallet': return renderWallet();
    case 'subscription': return <SubscriptionManager />;
    case 'settings': return renderSettings();      // KEEP existing
    default: return renderOverview();
  }
};
```

**L. New features integrated:**

1. **WhatsApp buttons** — In renderCases(), add a WhatsApp icon button next to each case card:
```typescript
{c.clientPhone && (
  <a href={generateWhatsAppLink(c.clientPhone, caseUpdateMessage({ clientName: c.clientName, caseTitle: c.caseTitle, update: 'Please contact our office for an update.' }))}
     target="_blank" rel="noopener noreferrer"
     style={{ ...iconBtnStyle, background: '#25D366', color: 'white' }}
     title="WhatsApp Client">
    💬
  </a>
)}
```

2. **Calendar sync buttons** — In renderDiary(), add per-entry and bulk export:
```typescript
{/* Per-entry */}
<button onClick={() => downloadSingleEntryICS(entry, userName)} style={smallBtnStyle} title="Add to Calendar">📅</button>

{/* Bulk export in diary header */}
<button onClick={() => {
  const upcoming = courtDiary.filter(e => e.date >= new Date().toISOString().split('T')[0] && e.status !== 'cancelled');
  downloadICS(upcoming, `court-diary-upcoming.ics`, userName);
}} style={actionBtn('#6366f1')}>📅 Export All to Calendar</button>
```

3. **Document templates** — Upgrade renderDocuments() to show template selection + generation form.

**M. Keep ALL existing render functions** that work:
- `renderDiary()` — Court Diary with Dexie (works, just add calendar/WhatsApp buttons)
- `renderCases()` — Cases & Clients with Dexie (works, just add WhatsApp buttons + clientPhone field in add-case modal)
- `renderTrust()` — Trust Accounting with Dexie (works as-is)
- `renderSettings()` — Settings (works as-is, keep BASL/Notary/Insurance/TIN fields)
- `renderAI()` — AI Tools placeholder (keep as-is for now)

**Step 2: Verify build**

Run: `npx tsc --noEmit 2>&1 | grep LegalDashboard` — expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/dashboards/LegalDashboard.tsx
git commit -m "feat(legal): complete production rewrite of LegalDashboard with full MedicalDashboard parity

- useAuth() replaces localStorage auth
- accountingCoreService for Firestore persistence
- useTokenWallet() for real token wallet
- useIsCompactMobile() + mobileShell for PWA
- BiometricGate on Trust/Income/VoiceVault
- SubscriptionGate on premium features
- VoiceInput replaces raw recording toggle
- KPICard, TransactionList, InvoiceForm integration
- 20 nav items (up from 9)
- URL ?action= deep linking
- WhatsApp client messaging
- Court calendar .ics export
- Document template engine
- Responsive gridColumns() throughout"
```

---

## Task 6: Final Build Verification

**Step 1: Full TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep -E "(LegalDashboard|whatsapp|calendar|legalDocument|db\.ts)" | head -20`

Expected: 0 errors from our files.

**Step 2: Verify Vite build succeeds**

Run: `npx vite build 2>&1 | tail -10`

Expected: Build completes with bundle output.

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(legal): resolve any build issues from production upgrade"
```

---

## Execution Notes

- Task 5 is the bulk of the work (~80% effort). Tasks 1-4 are service files that Task 5 imports.
- Execute Tasks 1-4 first (they're independent, can be parallelized).
- Task 5 depends on Tasks 1-4 being complete.
- Task 6 is verification after everything else.
- The existing `renderDiary()`, `renderCases()`, `renderTrust()`, `renderSettings()`, `renderAI()` functions should be preserved nearly as-is — they work with Dexie and that's fine to keep.
- The file will grow from ~1,071 to ~1,800+ lines (comparable to MedicalDashboard's 1,743).
