import { ProfessionType } from '../contexts/AuthContext';

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

const pricingRegistry: Partial<Record<ProfessionType, ProfessionPricing>> = {
  medical: medicalPricing,
  legal: legalPricing,
  aquaculture: aquaculturePricing,
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
