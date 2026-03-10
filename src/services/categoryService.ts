import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Category, CategoryFormData } from '../types';
import { EXPENSE_CATEGORIES } from '../utils/constants';

const COLLECTION_NAME = 'categories';

// Convert Firestore document to Category
const docToCategory = (doc: any): Category => {
  return {
    id: doc.id,
    ...doc.data()
  };
};

export const categoryService = {
  // Get all categories for a user (default + custom)
  async getUserCategories(userId: string): Promise<Category[]> {
    // Get custom categories
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const customCategories = querySnapshot.docs.map(docToCategory);

    // Combine with default categories
    const defaultCategories: Category[] = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      isDefault: true
    }));

    return [...defaultCategories, ...customCategories];
  },

  // Create a custom category
  async createCategory(userId: string, categoryData: CategoryFormData): Promise<string> {
    const category = {
      ...categoryData,
      userId,
      isDefault: false
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), category);
    return docRef.id;
  },

  // Update custom category
  async updateCategory(categoryId: string, updates: Partial<CategoryFormData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, categoryId);
    await updateDoc(docRef, updates);
  },

  // Delete custom category
  async deleteCategory(categoryId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, categoryId);
    await deleteDoc(docRef);
  },

  // Get default categories
  getDefaultCategories(): Category[] {
    return EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      isDefault: true
    }));
  },

  // Check if category is being used by expenses
  async isCategoryInUse(userId: string, categoryId: string): Promise<boolean> {
    // This would need to check the expenses collection
    // For now, we'll implement this when we have the expense queries
    return false;
  }
};