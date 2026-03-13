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
