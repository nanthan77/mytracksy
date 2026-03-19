/**
 * Default Chart of Accounts — Pre-seeded categories per profession
 *
 * When a user registers with a specific profession type,
 * we seed their `chart_of_accounts` sub-collection with these defaults.
 * Users can customise later.
 */

import type { ProfessionType } from '../types/profession';

export interface DefaultAccount {
    name: string;
    type: 'income' | 'expense' | 'asset' | 'liability';
    is_tax_deductible: boolean;
    metadata?: Record<string, any>;
}

// ─── Medical (Doctors) ──────────────────────────────────────────

const MEDICAL_ACCOUNTS: DefaultAccount[] = [
    // Income
    { name: 'Private Channeling', type: 'income', is_tax_deductible: false, metadata: { wht_rate: 0.05 } },
    { name: 'Consultation', type: 'income', is_tax_deductible: false, metadata: { wht_rate: 0.05 } },
    { name: 'Surgery', type: 'income', is_tax_deductible: false, metadata: { wht_rate: 0.05 } },
    { name: 'Lab / Diagnostic', type: 'income', is_tax_deductible: false },
    { name: 'Prescription Sales', type: 'income', is_tax_deductible: false },
    { name: 'Specialist Referral', type: 'income', is_tax_deductible: false },
    { name: 'Emergency / On-Call', type: 'income', is_tax_deductible: false },
    { name: 'Government Salary', type: 'income', is_tax_deductible: false, metadata: { is_employment: true } },
    { name: 'DAT Allowance', type: 'income', is_tax_deductible: false, metadata: { is_employment: true } },
    // Expenses — Golden List (Tax-Deductible)
    { name: 'SLMC / Professional Fees', type: 'expense', is_tax_deductible: true },
    { name: 'CME / Conferences', type: 'expense', is_tax_deductible: true },
    { name: 'Medical Journal Subscriptions', type: 'expense', is_tax_deductible: true },
    { name: 'PGIM Exam Fees', type: 'expense', is_tax_deductible: true },
    { name: 'Clinic Rent', type: 'expense', is_tax_deductible: true },
    { name: 'Clinic Utilities', type: 'expense', is_tax_deductible: true },
    { name: 'Staff Salaries', type: 'expense', is_tax_deductible: true },
    { name: 'Medical Consumables', type: 'expense', is_tax_deductible: true },
    { name: 'Medical Equipment', type: 'expense', is_tax_deductible: true, metadata: { is_capital_item: true } },
    { name: 'Vehicle (Practice)', type: 'expense', is_tax_deductible: true, metadata: { is_capital_item: true } },
    { name: 'Insurance (Professional)', type: 'expense', is_tax_deductible: true },
    { name: 'Travel (Practice)', type: 'expense', is_tax_deductible: true },
    // Non-deductible
    { name: 'Personal Expense', type: 'expense', is_tax_deductible: false },
    { name: 'Other Expense', type: 'expense', is_tax_deductible: false },
];

// ─── Retail (Shops) ─────────────────────────────────────────────

const RETAIL_ACCOUNTS: DefaultAccount[] = [
    { name: 'Daily Sales', type: 'income', is_tax_deductible: false },
    { name: 'Wholesale', type: 'income', is_tax_deductible: false },
    { name: 'Online Orders', type: 'income', is_tax_deductible: false },
    { name: 'Inventory Purchase', type: 'expense', is_tax_deductible: true },
    { name: 'Supplier Payments', type: 'expense', is_tax_deductible: true },
    { name: 'Staff Wages', type: 'expense', is_tax_deductible: true },
    { name: 'Shop Rent', type: 'expense', is_tax_deductible: true },
    { name: 'Utilities', type: 'expense', is_tax_deductible: true },
    { name: 'Marketing / Ads', type: 'expense', is_tax_deductible: true },
    { name: 'Transport / Delivery', type: 'expense', is_tax_deductible: true },
    { name: 'Equipment', type: 'expense', is_tax_deductible: true, metadata: { is_capital_item: true } },
    { name: 'Personal Expense', type: 'expense', is_tax_deductible: false },
];

// ─── Legal (Lawyers) ────────────────────────────────────────────

const LEGAL_ACCOUNTS: DefaultAccount[] = [
    { name: 'Case Fees', type: 'income', is_tax_deductible: false },
    { name: 'Retainer Fees', type: 'income', is_tax_deductible: false },
    { name: 'Consultation', type: 'income', is_tax_deductible: false },
    { name: 'Notary Fees', type: 'income', is_tax_deductible: false },
    { name: 'Bar Association Fees', type: 'expense', is_tax_deductible: true },
    { name: 'Law Library / Research', type: 'expense', is_tax_deductible: true },
    { name: 'Office Rent', type: 'expense', is_tax_deductible: true },
    { name: 'Clerk / Staff Salaries', type: 'expense', is_tax_deductible: true },
    { name: 'Court Filing Fees', type: 'expense', is_tax_deductible: true },
    { name: 'Travel (Court)', type: 'expense', is_tax_deductible: true },
    { name: 'Personal Expense', type: 'expense', is_tax_deductible: false },
];

// ─── Generic (Engineering, Business, etc.) ──────────────────────

const GENERIC_ACCOUNTS: DefaultAccount[] = [
    { name: 'Service Revenue', type: 'income', is_tax_deductible: false },
    { name: 'Product Sales', type: 'income', is_tax_deductible: false },
    { name: 'Freelance Income', type: 'income', is_tax_deductible: false },
    { name: 'Office Rent', type: 'expense', is_tax_deductible: true },
    { name: 'Utilities', type: 'expense', is_tax_deductible: true },
    { name: 'Staff Salaries', type: 'expense', is_tax_deductible: true },
    { name: 'Materials / Supplies', type: 'expense', is_tax_deductible: true },
    { name: 'Marketing / Ads', type: 'expense', is_tax_deductible: true },
    { name: 'Travel', type: 'expense', is_tax_deductible: true },
    { name: 'Equipment', type: 'expense', is_tax_deductible: true, metadata: { is_capital_item: true } },
    { name: 'Insurance', type: 'expense', is_tax_deductible: true },
    { name: 'Professional Fees', type: 'expense', is_tax_deductible: true },
    { name: 'Personal Expense', type: 'expense', is_tax_deductible: false },
];

// ─── Transport / Automotive ─────────────────────────────────────

const TRANSPORT_ACCOUNTS: DefaultAccount[] = [
    { name: 'Trip Revenue', type: 'income', is_tax_deductible: false },
    { name: 'Hire Charges', type: 'income', is_tax_deductible: false },
    { name: 'Fuel', type: 'expense', is_tax_deductible: true },
    { name: 'Vehicle Maintenance', type: 'expense', is_tax_deductible: true },
    { name: 'Insurance (Vehicle)', type: 'expense', is_tax_deductible: true },
    { name: 'License / Permits', type: 'expense', is_tax_deductible: true },
    { name: 'Driver Wages', type: 'expense', is_tax_deductible: true },
    { name: 'Toll / Parking', type: 'expense', is_tax_deductible: true },
    { name: 'Vehicle Purchase', type: 'expense', is_tax_deductible: true, metadata: { is_capital_item: true } },
    { name: 'Personal Expense', type: 'expense', is_tax_deductible: false },
];

// ─── Aquaculture ────────────────────────────────────────────────

const AQUA_ACCOUNTS: DefaultAccount[] = [
    { name: 'Harvest Sales', type: 'income', is_tax_deductible: false },
    { name: 'Export Revenue', type: 'income', is_tax_deductible: false },
    { name: 'Feed Purchase', type: 'expense', is_tax_deductible: true },
    { name: 'Fingerlings / Stock', type: 'expense', is_tax_deductible: true },
    { name: 'Pond Maintenance', type: 'expense', is_tax_deductible: true },
    { name: 'Labour Wages', type: 'expense', is_tax_deductible: true },
    { name: 'Equipment', type: 'expense', is_tax_deductible: true, metadata: { is_capital_item: true } },
    { name: 'Electricity / Pumps', type: 'expense', is_tax_deductible: true },
    { name: 'Personal Expense', type: 'expense', is_tax_deductible: false },
];

// ─── Studios / Photography ─────────────────────────────────────

const STUDIO_ACCOUNTS: DefaultAccount[] = [
    { name: 'Wedding Package Revenue', type: 'income', is_tax_deductible: false },
    { name: 'Pre-Shoot Revenue', type: 'income', is_tax_deductible: false },
    { name: 'Album Delivery Revenue', type: 'income', is_tax_deductible: false },
    { name: 'Commercial Shoot Revenue', type: 'income', is_tax_deductible: false },
    { name: 'Drone Operator Payout', type: 'expense', is_tax_deductible: true },
    { name: 'Second Shooter Payout', type: 'expense', is_tax_deductible: true },
    { name: 'Lighting Assistant Payout', type: 'expense', is_tax_deductible: true },
    { name: 'Album Printing', type: 'expense', is_tax_deductible: true },
    { name: 'Gear Rental', type: 'expense', is_tax_deductible: true },
    { name: 'Travel to Shoot', type: 'expense', is_tax_deductible: true },
    { name: 'Camera & Drone Purchase', type: 'expense', is_tax_deductible: true, metadata: { is_capital_item: true } },
    { name: 'Laptop / Editing Rig', type: 'expense', is_tax_deductible: true, metadata: { is_capital_item: true } },
    { name: 'Studio Software / Subscriptions', type: 'expense', is_tax_deductible: true },
    { name: 'Personal Expense', type: 'expense', is_tax_deductible: false },
];

// ─── Profession → Accounts Map ─────────────────────────────────

const PROFESSION_ACCOUNTS: Record<string, DefaultAccount[]> = {
    medical: MEDICAL_ACCOUNTS,
    retail: RETAIL_ACCOUNTS,
    legal: LEGAL_ACCOUNTS,
    engineering: GENERIC_ACCOUNTS,
    business: GENERIC_ACCOUNTS,
    individual: GENERIC_ACCOUNTS,
    trading: GENERIC_ACCOUNTS,
    automotive: TRANSPORT_ACCOUNTS,
    marketing: GENERIC_ACCOUNTS,
    travel: GENERIC_ACCOUNTS,
    transportation: TRANSPORT_ACCOUNTS,
    aquaculture: AQUA_ACCOUNTS,
    studios: STUDIO_ACCOUNTS,
};

/**
 * Get the default chart of accounts for a profession type.
 * Falls back to GENERIC_ACCOUNTS if the profession is not mapped.
 */
export function getDefaultAccounts(profession: ProfessionType | string): DefaultAccount[] {
    return PROFESSION_ACCOUNTS[profession] || GENERIC_ACCOUNTS;
}
