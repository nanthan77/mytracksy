import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { Income, IncomeFormData, IncomeStats } from '../types/income';

const COLLECTION_NAME = 'income';

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Convert Date to Firestore timestamp
const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Convert Firestore document to Income
const docToIncome = (doc: any): Income => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    date: timestampToDate(data.date),
    nextDate: data.nextDate ? timestampToDate(data.nextDate) : undefined,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  };
};

// Calculate next occurrence for recurring income
const calculateNextDate = (date: Date, frequency: string): Date => {
  const nextDate = new Date(date);
  
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'bi-weekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
};

export const incomeService = {
  // Create a new income entry
  async createIncome(userId: string, incomeData: IncomeFormData): Promise<string> {
    const now = new Date();
    const income = {
      ...incomeData,
      userId,
      date: dateToTimestamp(incomeData.date),
      nextDate: incomeData.recurring && incomeData.frequency ? 
        dateToTimestamp(calculateNextDate(incomeData.date, incomeData.frequency)) : 
        null,
      createdAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now)
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), income);
    return docRef.id;
  },

  // Get income by ID
  async getIncomeById(incomeId: string): Promise<Income | null> {
    const docRef = doc(db, COLLECTION_NAME, incomeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docToIncome(docSnap);
    }
    return null;
  },

  // Update income
  async updateIncome(incomeId: string, updates: Partial<IncomeFormData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, incomeId);
    const updateData: any = {
      ...updates,
      updatedAt: dateToTimestamp(new Date())
    };

    if (updates.date) {
      updateData.date = dateToTimestamp(updates.date);
    }

    // Recalculate next date if recurring settings changed
    if (updates.recurring !== undefined || updates.frequency || updates.date) {
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        const isRecurring = updates.recurring !== undefined ? updates.recurring : currentData.recurring;
        const frequency = updates.frequency || currentData.frequency;
        const date = updates.date || timestampToDate(currentData.date);

        if (isRecurring && frequency) {
          updateData.nextDate = dateToTimestamp(calculateNextDate(date, frequency));
        } else {
          updateData.nextDate = null;
        }
      }
    }

    await updateDoc(docRef, updateData);
  },

  // Delete income
  async deleteIncome(incomeId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, incomeId);
    await deleteDoc(docRef);
  },

  // Get user income entries
  async getUserIncome(userId: string, limitCount = 50): Promise<Income[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToIncome);
  },

  // Get income by date range
  async getIncomeByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Income[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('date', '>=', dateToTimestamp(startDate)),
      where('date', '<=', dateToTimestamp(endDate)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToIncome);
  },

  // Get recurring income
  async getRecurringIncome(userId: string): Promise<Income[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('recurring', '==', true),
      orderBy('nextDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToIncome);
  },

  // Get income statistics
  async getIncomeStats(userId: string, dateFrom?: Date, dateTo?: Date): Promise<IncomeStats> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId)
    ];

    if (dateFrom) {
      constraints.push(where('date', '>=', dateToTimestamp(dateFrom)));
    }

    if (dateTo) {
      constraints.push(where('date', '<=', dateToTimestamp(dateTo)));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const incomeEntries = querySnapshot.docs.map(docToIncome);
    
    if (incomeEntries.length === 0) {
      return {
        totalIncome: 0,
        totalIncomeEntries: 0,
        averageIncome: 0,
        topSource: '',
        sourceBreakdown: {},
        monthlyRecurring: 0,
        yearlyProjected: 0
      };
    }

    const totalIncome = incomeEntries.reduce((sum, income) => sum + income.amount, 0);
    const sourceBreakdown: { [source: string]: number } = {};
    
    incomeEntries.forEach(income => {
      sourceBreakdown[income.source] = (sourceBreakdown[income.source] || 0) + income.amount;
    });

    const topSource = Object.entries(sourceBreakdown).reduce((a, b) => 
      sourceBreakdown[a[0]] > sourceBreakdown[b[0]] ? a : b
    )[0] || '';

    // Calculate recurring income
    const recurringIncomes = await this.getRecurringIncome(userId);
    const monthlyRecurring = recurringIncomes.reduce((sum, income) => {
      switch (income.frequency) {
        case 'weekly':
          return sum + (income.amount * 4.33); // Average weeks per month
        case 'bi-weekly':
          return sum + (income.amount * 2.17); // Average bi-weeks per month
        case 'monthly':
          return sum + income.amount;
        case 'quarterly':
          return sum + (income.amount / 3);
        case 'yearly':
          return sum + (income.amount / 12);
        default:
          return sum;
      }
    }, 0);

    const yearlyProjected = monthlyRecurring * 12;

    return {
      totalIncome,
      totalIncomeEntries: incomeEntries.length,
      averageIncome: totalIncome / incomeEntries.length,
      topSource,
      sourceBreakdown,
      monthlyRecurring,
      yearlyProjected
    };
  },

  // Get recent income
  async getRecentIncome(userId: string, limitCount = 5): Promise<Income[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToIncome);
  },

  // Process due recurring income
  async processDueRecurringIncome(userId: string): Promise<string[]> {
    const now = new Date();
    const recurringIncomes = await this.getRecurringIncome(userId);
    const dueIncomes = recurringIncomes.filter(income => 
      income.nextDate && income.nextDate <= now
    );

    const createdIds: string[] = [];

    for (const income of dueIncomes) {
      // Create new income entry
      const newIncomeId = await this.createIncome(userId, {
        amount: income.amount,
        source: income.source,
        description: `${income.description} (Auto-generated)`,
        date: income.nextDate!,
        category: income.category,
        recurring: false, // Don't make the generated entry recurring
        taxable: income.taxable,
        tags: income.tags,
        notes: income.notes
      });

      createdIds.push(newIncomeId);

      // Update the original recurring income with next date
      const nextDate = calculateNextDate(income.nextDate!, income.frequency!);
      await this.updateIncome(income.id, { nextDate });
    }

    return createdIds;
  }
};