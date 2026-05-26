import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, expenseSchema } from '../../utils/validation';

// ═══════════════════════════════════════════════════════════
// UNIT TESTS — Yup Validation Schemas
// Coverage: login, register, expense form validation
// ═══════════════════════════════════════════════════════════

describe('loginSchema', () => {
  it('validates correct login data', async () => {
    const data = { email: 'user@example.com', password: 'password123' };
    await expect(loginSchema.validate(data)).resolves.toEqual(data);
  });

  it('rejects missing email', async () => {
    const data = { email: '', password: 'password123' };
    await expect(loginSchema.validate(data)).rejects.toThrow('Email is required');
  });

  it('rejects invalid email', async () => {
    const data = { email: 'not-email', password: 'password123' };
    await expect(loginSchema.validate(data)).rejects.toThrow('valid email');
  });

  it('rejects short password', async () => {
    const data = { email: 'user@example.com', password: '123' };
    await expect(loginSchema.validate(data)).rejects.toThrow('at least 6 characters');
  });

  it('rejects missing password', async () => {
    const data = { email: 'user@example.com', password: '' };
    // Yup min(6) fires before required() for empty string
    await expect(loginSchema.validate(data)).rejects.toThrow('at least 6 characters');
  });
});

describe('registerSchema', () => {
  const validData = {
    displayName: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('validates correct registration data', async () => {
    await expect(registerSchema.validate(validData)).resolves.toBeDefined();
  });

  it('rejects short display name', async () => {
    await expect(
      registerSchema.validate({ ...validData, displayName: 'J' })
    ).rejects.toThrow('at least 2 characters');
  });

  it('rejects long display name', async () => {
    await expect(
      registerSchema.validate({ ...validData, displayName: 'a'.repeat(51) })
    ).rejects.toThrow('less than 50 characters');
  });

  it('rejects mismatched passwords', async () => {
    await expect(
      registerSchema.validate({ ...validData, confirmPassword: 'different' })
    ).rejects.toThrow('Passwords must match');
  });

  it('rejects missing confirm password', async () => {
    await expect(
      registerSchema.validate({ ...validData, confirmPassword: '' })
    ).rejects.toThrow();
  });
});

describe('expenseSchema', () => {
  const validExpense = {
    description: 'Lunch at Noodles',
    amount: 1500,
    category: 'food',
    date: new Date('2024-01-15'),
  };

  it('validates correct expense data', async () => {
    await expect(expenseSchema.validate(validExpense)).resolves.toBeDefined();
  });

  it('rejects missing description', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, description: '' })
    ).rejects.toThrow('Description is required');
  });

  it('rejects short description', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, description: 'A' })
    ).rejects.toThrow('at least 2 characters');
  });

  it('rejects negative amount', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, amount: -100 })
    ).rejects.toThrow('positive');
  });

  it('rejects zero amount', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, amount: 0 })
    ).rejects.toThrow('positive');
  });

  it('rejects overly large amount', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, amount: 1_000_000 })
    ).rejects.toThrow('less than 1,000,000');
  });

  it('rejects future date', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    await expect(
      expenseSchema.validate({ ...validExpense, date: futureDate })
    ).rejects.toThrow('cannot be in the future');
  });

  it('rejects missing category', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, category: '' })
    ).rejects.toThrow('Category is required');
  });

  it('accepts optional payment method', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, paymentMethod: 'cash' })
    ).resolves.toBeDefined();
  });

  it('rejects invalid payment method', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, paymentMethod: 'bitcoin' })
    ).rejects.toThrow();
  });

  it('rejects long notes', async () => {
    await expect(
      expenseSchema.validate({ ...validExpense, notes: 'x'.repeat(501) })
    ).rejects.toThrow('less than 500 characters');
  });
});
