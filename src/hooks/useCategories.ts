import { useState, useEffect, useCallback } from 'react';
import { Category, CategoryFormData } from '../types';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';

export const useCategories = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const userCategories = await categoryService.getUserCategories(currentUser.uid);
      setCategories(userCategories);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const createCategory = useCallback(async (categoryData: CategoryFormData): Promise<string | null> => {
    if (!currentUser) return null;

    try {
      setError(null);
      const categoryId = await categoryService.createCategory(currentUser.uid, categoryData);
      await loadCategories(); // Reload categories
      return categoryId;
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      return null;
    }
  }, [currentUser, loadCategories]);

  const updateCategory = useCallback(async (categoryId: string, updates: Partial<CategoryFormData>): Promise<boolean> => {
    try {
      setError(null);
      await categoryService.updateCategory(categoryId, updates);
      await loadCategories(); // Reload categories
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      return false;
    }
  }, [loadCategories]);

  const deleteCategory = useCallback(async (categoryId: string): Promise<boolean> => {
    try {
      setError(null);
      await categoryService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(category => category.id !== categoryId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      return false;
    }
  }, []);

  const getDefaultCategories = useCallback(() => {
    return categoryService.getDefaultCategories();
  }, []);

  const getCategoryById = useCallback((categoryId: string): Category | undefined => {
    return categories.find(cat => cat.id === categoryId);
  }, [categories]);

  const getCategoryByName = useCallback((categoryName: string): Category | undefined => {
    return categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  }, [categories]);

  useEffect(() => {
    if (currentUser) {
      loadCategories();
    }
  }, [currentUser, loadCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getDefaultCategories,
    getCategoryById,
    getCategoryByName,
    refresh: loadCategories
  };
};