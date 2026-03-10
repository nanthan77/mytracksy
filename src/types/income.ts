export interface Income {
  id: string;
  userId: string;
  amount: number;
  source: string; // e.g., 'salary', 'freelance', 'investment', 'business', 'other'
  description: string;
  date: Date;
  category: string;
  recurring: boolean;
  frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDate?: Date; // For recurring income
  tags?: string[];
  notes?: string;
  taxable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  userId?: string;
  isDefault?: boolean;
}

export interface IncomeStats {
  totalIncome: number;
  totalIncomeEntries: number;
  averageIncome: number;
  topSource: string;
  sourceBreakdown: { [source: string]: number };
  monthlyRecurring: number;
  yearlyProjected: number;
}

export type IncomeFormData = Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type IncomeCategoryFormData = Omit<IncomeCategory, 'id' | 'userId' | 'isDefault'>;