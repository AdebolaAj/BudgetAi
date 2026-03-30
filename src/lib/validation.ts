import { z } from 'zod';

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  password: z.string().min(8).max(256),
});

export const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});

export const financialProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phoneNumber: z.string().trim().max(40),
  address: z.string().trim().max(300),
  employerName: z.string().trim().max(160),
  taxStatus: z.enum([
    '',
    'single',
    'married_filing_jointly',
    'married_filing_separately',
    'head_of_household',
    'qualifying_surviving_spouse',
  ]),
  salary: z.string().trim().max(40),
  frequency: z.enum(['hourly', 'monthly', 'yearly']),
  userLocation: z.string().trim().max(160),
  workLocation: z.string().trim().max(160),
  currentSavings: z.string().trim().max(40),
  monthlyRent: z.string().trim().max(40),
  monthlyBills: z.string().trim().max(40),
  monthlyFoodBudget: z.string().trim().max(40),
  monthlyTransport: z.string().trim().max(40),
  monthlyUtilities: z.string().trim().max(40),
  monthlyInsurance: z.string().trim().max(40),
  monthlyPlans: z.string().trim().max(40),
  monthlyDonations: z.string().trim().max(40),
  monthlyEntertainment: z.string().trim().max(40),
  savingsGoal: z.string().trim().max(40),
  investmentAmount: z.string().trim().max(40),
  emergencyFund: z.string().trim().max(40),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
});

export const goalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().max(120).optional().default(''),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  targetAmount: z.string().trim().min(1).max(40),
  targetDate: z.string().trim().max(40).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
});

export const transactionSchema = z.object({
  entryType: z.enum(['credit', 'debit']),
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(1000).optional().default(''),
  amount: z.string().trim().min(1).max(40),
  occurredOn: z.string().trim().min(1).max(40),
});

export const accountSettingsSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    email: z.email().max(254),
    currentPassword: z.string().min(1).max(256),
  }),
  z.object({
    type: z.literal('password'),
    currentPassword: z.string().min(1).max(256),
    newPassword: z.string().min(8).max(256),
  }),
  z.object({
    type: z.literal('subscription'),
    subscriptionPlan: z.enum(['starter', 'plus', 'pro']),
  }),
]);

export const plaidLinkTokenSchema = z.object({
  plaidItemId: z.uuid().optional(),
});

export const plaidExchangeSchema = z.object({
  publicToken: z.string().trim().min(1).max(512),
  institutionId: z.string().trim().max(120).optional().default(''),
  institutionName: z.string().trim().max(160).optional().default(''),
  plaidItemId: z.string().trim().max(120).optional().default(''),
  accounts: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(120),
        name: z.string().trim().max(160),
        mask: z.string().trim().max(20),
        type: z.string().trim().max(80),
        subtype: z.string().trim().max(80),
      })
    )
    .optional()
    .default([]),
});
