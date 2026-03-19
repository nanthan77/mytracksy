import { ProfessionType } from '../types/profession';

export type TierKey = 'free' | 'pro' | 'chambers';

export interface PricingTier {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  aiTokens: number;
  badge?: string;
  highlighted?: boolean;
  tierKey: TierKey;
}

export interface ProfessionPricing {
  profession: ProfessionType;
  tiers: PricingTier[];
  tokenStore: { price: number; tokens: number };
}

// ═══════════════════════════════════════════════════
//  MEDICAL — Doctors, Surgeons, Dentists
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
//  LEGAL — Attorneys, Notaries, Legal Counsel
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
//  AQUACULTURE — Fish Farmers, Hatcheries
// ═══════════════════════════════════════════════════
const aquaculturePricing: ProfessionPricing = {
  profession: 'aquaculture',
  tiers: [
    {
      id: 'aqua-free',
      name: 'Free Trial',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '2 Ponds / 1 Cycle',
        'Voice Logging (5/month)',
        'Basic Pond P&L',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'aqua-pro',
      name: 'Single Farm',
      monthlyPrice: 3900,
      annualPrice: 39000,
      features: [
        'Up to 5 Ponds',
        'Unlimited Voice AI Logs',
        'Feed Inventory & FCR Tracker',
        'Harvest Delivery Notes (PDF)',
        'Pond-by-Pond Profitability',
        'Cloud Backup & Sync',
        '1 Admin Login',
      ],
      aiTokens: 50,
      badge: 'Ideal for Individual Farmers',
      highlighted: true,
      tierKey: 'pro',
    },
    {
      id: 'aqua-hatchery',
      name: 'Commercial Hatchery',
      monthlyPrice: 14900,
      annualPrice: 149000,
      features: [
        'Unlimited Ponds',
        'Multi-Farm God Mode',
        'Sub-logins for Farm Managers',
        'Export Harvest Ledger (USD/LKR)',
        'NAQDA & Bank Loan Reports',
        '250 AI Tokens/month',
        'Dedicated Account Manager',
      ],
      aiTokens: 250,
      highlighted: false,
      tierKey: 'chambers',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  TOURISM — Chauffeur Guides, Tour Agencies
// ═══════════════════════════════════════════════════
const tourismPricing: ProfessionPricing = {
  profession: 'tourism',
  tiers: [
    {
      id: 'tourism-free',
      name: 'Free Launch',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Single User Wallet',
        'Auto-Sync Multi-Currency Logs',
        'Offline Voice Expense Capture',
        'Basic Trip P&L',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'tourism-pro',
      name: 'Guide Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Trip-Based Contextual Accounting',
        'Multi-Currency CBSL Auto-Sync',
        'Commission Tracker (Kutti Ledger)',
        'AI Route & Itinerary Generator',
        'Driver Settlement PDF Engine',
        '1-Click Tax Export',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible SLTDA Professional Expense',
      highlighted: true,
      tierKey: 'pro',
    },
    {
      id: 'tourism-agency',
      name: 'Agency Plan',
      monthlyPrice: 9900,
      annualPrice: 99000,
      features: [
        'Everything in Guide Pro',
        'Multi-Driver Management',
        'Fleet Expense Dashboard',
        'Bulk Settlement Generator',
        '250 AI Tokens/month',
        'Dedicated Account Manager',
        'Custom PDF Branding',
      ],
      aiTokens: 250,
      highlighted: false,
      tierKey: 'chambers',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  CREATOR — YouTubers, Streamers, Influencers
// ═══════════════════════════════════════════════════
const creatorPricing: ProfessionPricing = {
  profession: 'creator',
  tiers: [
    {
      id: 'creator-free',
      name: 'Starter',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Transactions/month',
        'Basic Income Tracking',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'creator-pro',
      name: 'Pro Creator',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'AdSense USD Auto-Convert (CBSL)',
        'Brand Deal CRM & Invoice',
        'Gear Vault (Depreciation Write-Offs)',
        'Bank-Ready Income Statements',
        'Multi-Platform Revenue Dashboard',
        'AI Content Tax Advisor',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible Business Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  STUDIOS — Wedding Photographers, Production Houses
// ═══════════════════════════════════════════════════
const studiosPricing: ProfessionPricing = {
  profession: 'studios',
  tiers: [
    {
      id: 'studios-free',
      name: 'Free Solo Photographer',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Up to 3 active shoots per month',
        'Manual invoices, payment logs, and delivery tracking',
        'Basic gear vault for one main camera setup',
        'Personal tax snapshot and profit view',
        '25 AI Tokens included',
        'Upgrade when you need reminders, team payouts, and full tax automation',
      ],
      aiTokens: 25,
      badge: 'Free forever for solo shooters',
      tierKey: 'free',
    },
    {
      id: 'studios-pro',
      name: 'Premium Wedding Pro',
      monthlyPrice: 6900,
      annualPrice: 69000,
      features: [
        'Unlimited events & milestone billing',
        'Event profit margin dashboard',
        'Unlimited gear depreciation vault',
        'WhatsApp payment reminders',
        'AI contract builder & client diplomat',
        '100 AI Tokens included',
      ],
      aiTokens: 100,
      badge: '100% Tax Deductible Studio Expense',
      highlighted: true,
      tierKey: 'pro',
    },
    {
      id: 'studios-chambers',
      name: 'Pvt Ltd Studio',
      monthlyPrice: 19900,
      annualPrice: 199000,
      features: [
        'Everything in Premium Wedding Pro',
        'Multi-user team access & restricted roles',
        'Advanced freelancer payout tracking',
        'Corporate VAT and tax workflow',
        '500 AI Tokens included',
        'Dedicated onboarding support',
      ],
      aiTokens: 500,
      tierKey: 'chambers',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  ENGINEERING — Civil, Mech, Electrical Engineers
// ═══════════════════════════════════════════════════
const engineeringPricing: ProfessionPricing = {
  profession: 'engineering',
  tiers: [
    {
      id: 'engineering-free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Transactions/month',
        'Basic Project Costing',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'engineering-pro',
      name: 'Engineer Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Unlimited Project Folios',
        'Material Cost Estimator',
        'Sub-Contractor Payment Tracker',
        'BOQ-Linked Expense Logging',
        'Variation Order Management',
        'AI Site Report Generator',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible IESL Professional Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  BUSINESS — SMEs, Sole Proprietors
// ═══════════════════════════════════════════════════
const businessPricing: ProfessionPricing = {
  profession: 'business',
  tiers: [
    {
      id: 'business-free',
      name: 'Starter',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Transactions/month',
        'Basic Invoicing',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'business-pro',
      name: 'Business Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Unlimited Transactions',
        'Smart Invoicing & Quotations',
        'Expense Categorization AI',
        'IRD Tax Automation',
        'Multi-Entity Management',
        'Cloud Backup & Sync',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible Business Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  TRADING — Stock, Forex, Commodity Traders
// ═══════════════════════════════════════════════════
const tradingPricing: ProfessionPricing = {
  profession: 'trading',
  tiers: [
    {
      id: 'trading-free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Trades/month',
        'Basic P&L Tracking',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'trading-pro',
      name: 'Trader Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Unlimited Trade Logging',
        'Multi-Currency Portfolio View (CSE/Forex)',
        'Capital Gains Tax Calculator',
        'Dividend Income Tracker',
        'AI Market Insights',
        'Cloud Backup & Sync',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible Investment Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  AUTOMOTIVE — Garages, Mechanics, Dealers
// ═══════════════════════════════════════════════════
const automotivePricing: ProfessionPricing = {
  profession: 'automotive',
  tiers: [
    {
      id: 'automotive-free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Jobs/month',
        'Basic Job Cards',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'automotive-pro',
      name: 'Garage Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Unlimited Job Cards',
        'Parts Inventory Management',
        'Customer Vehicle History',
        'Invoice & Quotation Generator',
        'Mechanic Productivity Tracker',
        'Cloud Backup & Sync',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible Business Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  MARKETING — Agencies, Freelancers
// ═══════════════════════════════════════════════════
const marketingPricing: ProfessionPricing = {
  profession: 'marketing',
  tiers: [
    {
      id: 'marketing-free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Transactions/month',
        'Basic Client Tracking',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'marketing-pro',
      name: 'Agency Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Unlimited Client Projects',
        'Campaign Budget Tracker',
        'Retainer & Invoice Manager',
        'Ad Spend vs Revenue Analytics',
        'AI Brief Generator',
        'Cloud Backup & Sync',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible Business Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  TRAVEL — Travel Agents (identical to tourism)
// ═══════════════════════════════════════════════════
const travelPricing: ProfessionPricing = {
  ...tourismPricing,
  profession: 'travel',
  tiers: tourismPricing.tiers.map(t => ({ ...t, id: t.id.replace('tourism-', 'travel-') })),
};

// ═══════════════════════════════════════════════════
//  TRANSPORTATION — Lorry, Bus, Fleet Operators
// ═══════════════════════════════════════════════════
const transportationPricing: ProfessionPricing = {
  profession: 'transportation',
  tiers: [
    {
      id: 'transport-free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Trips/month',
        'Basic Fuel Log',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'transport-pro',
      name: 'Fleet Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Unlimited Trip Logging',
        'Fuel Efficiency Analytics',
        'Driver Payment Settlements',
        'Vehicle Maintenance Tracker',
        'Route Revenue Reports',
        'Cloud Backup & Sync',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible Business Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  RETAIL — Shop Owners, Boutiques
// ═══════════════════════════════════════════════════
const retailPricing: ProfessionPricing = {
  profession: 'retail',
  tiers: [
    {
      id: 'retail-free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Transactions/month',
        'Basic POS Mode',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'retail-pro',
      name: 'Shop Pro',
      monthlyPrice: 2900,
      annualPrice: 25000,
      features: [
        'Unlimited Sales Tracking',
        'Inventory Management',
        'Supplier Payment Tracker',
        'Daily Cash Reconciliation',
        'Customer Credit Book',
        'Cloud Backup & Sync',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: '100% Tax Deductible Business Expense',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  INDIVIDUAL — Personal Finance
// ═══════════════════════════════════════════════════
const individualPricing: ProfessionPricing = {
  profession: 'individual',
  tiers: [
    {
      id: 'individual-free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '50 Transactions/month',
        'Basic Budget Tracker',
        '5 AI Voice Notes/month',
        'Offline Mode',
      ],
      aiTokens: 0,
      tierKey: 'free',
    },
    {
      id: 'individual-pro',
      name: 'Personal Pro',
      monthlyPrice: 1900,
      annualPrice: 19000,
      features: [
        'Unlimited Transactions',
        'Family Budget Sharing',
        'Investment Portfolio Tracker',
        'Bill Reminder & Auto-Log',
        'Tax Filing Helper (APIT)',
        'Cloud Backup & Sync',
        '50 AI Tokens/month',
      ],
      aiTokens: 50,
      badge: 'Save more than you spend on the app',
      highlighted: true,
      tierKey: 'pro',
    },
  ],
  tokenStore: { price: 1500, tokens: 100 },
};

// ═══════════════════════════════════════════════════
//  REGISTRY — Maps ProfessionType → Pricing
// ═══════════════════════════════════════════════════
const pricingRegistry: Partial<Record<ProfessionType, ProfessionPricing>> = {
  medical: medicalPricing,
  legal: legalPricing,
  aquaculture: aquaculturePricing,
  tourism: tourismPricing,
  travel: travelPricing,
  creator: creatorPricing,
  studios: studiosPricing,
  engineering: engineeringPricing,
  business: businessPricing,
  trading: tradingPricing,
  automotive: automotivePricing,
  marketing: marketingPricing,
  transportation: transportationPricing,
  retail: retailPricing,
  individual: individualPricing,
};

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

/** Profession-specific paywall anchor text (used by SubscriptionGate) */
export const PAYWALL_ANCHORS: Partial<Record<ProfessionType, string>> = {
  medical: '💡 Less than ONE patient consultation per month',
  legal: '💡 Less than ONE client consultation per month',
  tourism: '💡 Less than HALF a standard tour commission',
  creator: '💡 Less than ONE brand deal negotiation',
  studios: '💡 Less than ONE missed album installment',
  engineering: '💡 Less than ONE site visit expense',
  aquaculture: '💡 Less than ONE harvest delivery margin',
  business: '💡 Less than ONE invoice you would lose track of',
  trading: '💡 Less than ONE profitable trade commission',
  automotive: '💡 Less than ONE job card profit margin',
  marketing: '💡 Less than ONE hour of client billing',
  transportation: '💡 Less than ONE trip fuel cost',
  retail: '💡 Less than ONE day of shop expenses',
  individual: '💡 Less than ONE restaurant dinner',
};
