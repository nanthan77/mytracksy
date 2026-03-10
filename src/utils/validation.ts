import * as yup from 'yup';

// Login form validation schema
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

// Register form validation schema
export const registerSchema = yup.object().shape({
  displayName: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Full name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

// Expense form validation schema
export const expenseSchema = yup.object().shape({
  description: yup
    .string()
    .required('Description is required')
    .min(2, 'Description must be at least 2 characters')
    .max(100, 'Description must be less than 100 characters'),
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .max(999999, 'Amount must be less than 1,000,000'),
  category: yup
    .string()
    .required('Category is required'),
  date: yup
    .date()
    .required('Date is required')
    .max(new Date(), 'Date cannot be in the future'),
  paymentMethod: yup
    .string()
    .oneOf(['cash', 'card', 'transfer', 'other'])
    .optional(),
  notes: yup
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  tags: yup
    .array()
    .of(yup.string())
    .optional()
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type ExpenseFormData = yup.InferType<typeof expenseSchema>;