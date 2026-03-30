import { getCurrentSessionUser } from '@/lib/auth';
import { getPool, ensureDatabaseSetup } from '@/lib/db';
import {
  buildFinancialReport,
  financialProfileFromRow,
  getEmptyFinancialProfile,
  type FinancialProfileRow,
} from '@/lib/financialProfile';

export type TransactionEntry = {
  id: string;
  entry_type: 'credit' | 'debit';
  title: string;
  category: string;
  notes: string;
  amount: string;
  occurred_on: string;
  created_at: string;
};

export type PlaidTransaction = {
  transaction_id: string;
  name: string;
  merchant_name: string;
  amount: string;
  iso_currency_code: string;
  date: string;
  authorized_date: string | null;
  category_primary: string;
  category_detailed: string;
  payment_channel: string;
  pending: boolean;
  institution_name: string;
};

export type LinkedPlaidAccount = {
  account_id: string;
  plaid_item_id: string;
  institution_id: string;
  institution_name: string;
  name: string;
  mask: string;
  official_name: string;
  type: string;
  subtype: string;
  available_balance: string | null;
  current_balance: string | null;
  credit_limit: string | null;
  iso_currency_code: string;
  is_selected: boolean;
  is_active: boolean;
};

export type SpendingBreakdownItem = {
  label: string;
  value: number;
};

export type SpendingRangeKey = 'monthly' | 'threeMonths' | 'sixMonths' | 'yearly' | 'yearToDate';

export type SpendingComparisonTotals = {
  monthly: number;
  threeMonths: number;
  sixMonths: number;
  yearly: number;
  yearToDate: number;
};

export type BudgetCaps = {
  food: number;
  transport: number;
  utilities: number;
  entertainment: number;
  subscriptions: number;
  donations: number;
};

type PlaidInflowRow = {
  amount: string;
  name: string;
  merchant_name: string;
  category_primary: string;
  category_detailed: string;
};

type PlaidSpendingRow = {
  amount: string;
  date: string;
  category_primary: string;
  category_detailed: string;
  merchant_name: string;
  name: string;
};

const PAYROLL_KEYWORDS = [
  'PAYROLL',
  'PAYCHECK',
  'SALARY',
  'DIRECT DEP',
  'DIRECT DEPOSIT',
  'ADP',
  'PAYCHEX',
  'GUSTO',
  'RIPPLING',
  'TRINET',
  'WORKDAY',
  'JUSTWORKS',
  'INTUIT PAYROLL',
];

const EXCLUDED_INFLOW_KEYWORDS = [
  'TRANSFER',
  'VENMO',
  'ZELLE',
  'CASH APP',
  'PAYPAL',
  'REFUND',
  'REVERSAL',
  'RETURN',
  'TREAS 310',
  'IRS TREAS',
  'TAX REFUND',
  'DIVIDEND',
  'INTEREST',
];

const UTILITY_KEYWORDS = [
  'UTILITY',
  'UTILITIES',
  'ELECTRIC',
  'ENERGY',
  'POWER',
  'WATER',
  'SEWER',
  'GAS',
  'INTERNET',
  'BROADBAND',
  'PHONE',
  'MOBILE',
  'WIRELESS',
  'CABLE',
  'TELECOM',
];

function categorizePlaidSpend(row: Pick<PlaidSpendingRow, 'category_primary' | 'category_detailed' | 'merchant_name' | 'name'>) {
  const normalized = row.category_primary.trim().toUpperCase();
  const detailed = row.category_detailed.trim().toUpperCase();
  const descriptor = normalizeText(`${row.name} ${row.merchant_name} ${row.category_detailed}`);

  if (!normalized) return 'Other';
  if (normalized.includes('FOOD') || normalized.includes('DINING')) return 'Food';
  if (normalized.includes('TRANSPORT')) return 'Transport';
  if (normalized.includes('RENT') || normalized.includes('MORTGAGE') || normalized.includes('HOUSING'))
    return 'Rent / Mortgage';
  if (
    normalized.includes('UTILITY') ||
    detailed.includes('UTILITY') ||
    UTILITY_KEYWORDS.some((keyword) => descriptor.includes(keyword))
  ) {
    return 'Utilities';
  }
  if (normalized.includes('GENERAL_MERCHANDISE') || normalized.includes('GENERAL SERVICES'))
    return 'Bills';
  if (normalized.includes('ENTERTAINMENT') || normalized.includes('RECREATION')) return 'Entertainment';
  if (normalized.includes('INCOME')) return 'Income';

  return row.category_primary
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function normalizeText(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
}

function matchesEmployer(descriptor: string, employerName: string) {
  const normalizedEmployer = normalizeText(employerName);
  if (!normalizedEmployer) {
    return false;
  }

  return normalizedEmployer
    .split(' ')
    .filter((token) => token.length >= 3)
    .some((token) => descriptor.includes(token));
}

function isPaycheckLike(row: PlaidInflowRow, employerName: string) {
  const descriptor = normalizeText(
    `${row.name} ${row.merchant_name} ${row.category_primary} ${row.category_detailed}`
  );

  if (!descriptor) {
    return false;
  }

  if (EXCLUDED_INFLOW_KEYWORDS.some((keyword) => descriptor.includes(keyword))) {
    return false;
  }

  if (descriptor.includes('INCOME') || descriptor.includes('PAYROLL')) {
    return true;
  }

  if (matchesEmployer(descriptor, employerName)) {
    return true;
  }

  return PAYROLL_KEYWORDS.some((keyword) => descriptor.includes(keyword));
}

function isSavingsAccount(account: LinkedPlaidAccount) {
  if (!account.is_active || !account.is_selected) {
    return false;
  }

  const type = account.type.trim().toLowerCase();
  const subtype = account.subtype.trim().toLowerCase();

  if (type !== 'depository') {
    return false;
  }

  return (
    subtype === 'savings' ||
    subtype === 'money market' ||
    subtype === 'money_market' ||
    subtype === 'cd'
  );
}

export async function getProfileData() {
  await ensureDatabaseSetup();
  const user = await getCurrentSessionUser();

  if (!user) {
    return null;
  }

  const pool = getPool();
  const result = await pool.query<FinancialProfileRow>(
    `
      SELECT
        phone_number,
        address,
        employer_name,
        tax_status,
        frequency,
        salary,
        user_location,
        work_location,
        current_savings,
        monthly_rent,
        monthly_bills,
        monthly_food_budget,
        monthly_transport,
        monthly_utilities,
        monthly_insurance,
        monthly_plans,
        monthly_donations,
        monthly_entertainment,
        savings_goal,
        investment_amount,
        emergency_fund,
        currency
      FROM financial_profiles
      WHERE user_id = $1
    `,
    [user.id]
  );

  const profile = result.rows[0]
    ? financialProfileFromRow(result.rows[0], user.full_name)
    : getEmptyFinancialProfile(user.full_name);

  const transactionResult = await pool.query<TransactionEntry>(
    `
      SELECT id, entry_type, title, category, notes, amount::text, occurred_on::text, created_at::text
      FROM transaction_entries
      WHERE user_id = $1
      ORDER BY occurred_on DESC, created_at DESC
      LIMIT 12
    `,
    [user.id]
  );

  const transactionNet = transactionResult.rows.reduce((total, entry) => {
    const amount = Number(entry.amount) || 0;
    return total + (entry.entry_type === 'credit' ? amount : -amount);
  }, 0);

  const plaidItemCountResult = await pool.query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM plaid_items
      WHERE user_id = $1
    `,
    [user.id]
  );
  const hasConnectedPlaidItem = Number(plaidItemCountResult.rows[0]?.total ?? '0') > 0;

  const plaidTransactionResult = await pool.query<PlaidTransaction>(
    `
      SELECT
        plaid_transactions.transaction_id,
        plaid_transactions.name,
        plaid_transactions.merchant_name,
        plaid_transactions.amount::text,
        plaid_transactions.iso_currency_code,
        plaid_transactions.date::text,
        plaid_transactions.authorized_date::text,
        plaid_transactions.category_primary,
        plaid_transactions.category_detailed,
        plaid_transactions.payment_channel,
        plaid_transactions.pending,
        plaid_items.institution_name
      FROM plaid_transactions
      JOIN plaid_items ON plaid_items.id = plaid_transactions.plaid_item_id
      WHERE plaid_transactions.user_id = $1
      ORDER BY plaid_transactions.date DESC, plaid_transactions.updated_at DESC
      LIMIT 50
    `,
    [user.id]
  );

  const linkedAccountsResult = await pool.query<LinkedPlaidAccount>(
    `
      SELECT
        plaid_accounts.account_id,
        plaid_accounts.plaid_item_id,
        plaid_items.institution_id,
        plaid_accounts.institution_name,
        plaid_accounts.name,
        plaid_accounts.mask,
        plaid_accounts.official_name,
        plaid_accounts.type,
        plaid_accounts.subtype,
        plaid_accounts.available_balance::text,
        plaid_accounts.current_balance::text,
        plaid_accounts.credit_limit::text,
        plaid_accounts.iso_currency_code,
        plaid_accounts.is_selected,
        plaid_accounts.is_active
      FROM plaid_accounts
      JOIN plaid_items ON plaid_items.id = plaid_accounts.plaid_item_id
      WHERE plaid_accounts.user_id = $1
      ORDER BY
        plaid_accounts.institution_name ASC,
        plaid_accounts.type ASC,
        plaid_accounts.subtype ASC,
        plaid_accounts.name ASC
    `,
    [user.id]
  );

  const dedupedLinkedAccounts = Array.from(
    new Map(
      linkedAccountsResult.rows.map((account) => [
        [
          account.institution_id,
          account.mask,
          account.name.trim().toUpperCase(),
          account.type.trim().toUpperCase(),
          account.subtype.trim().toUpperCase(),
        ].join('::'),
        account,
      ])
    ).values()
  );

  const latestPaycheckTransaction = plaidTransactionResult.rows.find(
    (transaction) => Number(transaction.amount) < 0 && isPaycheckLike(transaction, profile.employerName)
  );

  const orderedPlaidTransactions = latestPaycheckTransaction
    ? [
        latestPaycheckTransaction,
        ...plaidTransactionResult.rows.filter(
          (transaction) => transaction.transaction_id !== latestPaycheckTransaction.transaction_id
        ),
      ]
    : plaidTransactionResult.rows;

  const plaidExpenseAggregate = await pool.query<{ total: string }>(
    `
      SELECT COALESCE(SUM(amount), 0)::text AS total
      FROM plaid_transactions
      WHERE user_id = $1
        AND amount > 0
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    `,
    [user.id]
  );

  const plaidMonthlyExpenses = Number(plaidExpenseAggregate.rows[0]?.total ?? '0');
  const hasPlaidExpenseHistory = plaidMonthlyExpenses > 0;

  const plaidInflowRows = await pool.query<PlaidInflowRow>(
    `
      SELECT amount::text, name, merchant_name, category_primary, category_detailed
      FROM plaid_transactions
      WHERE user_id = $1
        AND amount < 0
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    `,
    [user.id]
  );

  const actualPaycheckInflows = plaidInflowRows.rows.reduce((total, row) => {
    if (!isPaycheckLike(row, profile.employerName)) {
      return total;
    }

    return total + Math.abs(Number(row.amount) || 0);
  }, 0);
  const hasActualPaycheckHistory = actualPaycheckInflows > 0;

  const plaidSpendingRows = await pool.query<PlaidSpendingRow>(
    `
      SELECT amount::text, date::text, category_primary, category_detailed, merchant_name, name
      FROM plaid_transactions
      WHERE user_id = $1
        AND amount > 0
        AND date >= CURRENT_DATE - INTERVAL '365 days'
    `,
    [user.id]
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const spendingByRange: Record<SpendingRangeKey, Map<string, number>> = {
    monthly: new Map(),
    threeMonths: new Map(),
    sixMonths: new Map(),
    yearly: new Map(),
    yearToDate: new Map(),
  };
  const comparisonSpending: SpendingComparisonTotals = {
    monthly: 0,
    threeMonths: 0,
    sixMonths: 0,
    yearly: 0,
    yearToDate: 0,
  };

  for (const row of plaidSpendingRows.rows) {
    const amount = Number(row.amount) || 0;
    const date = new Date(row.date);
    const ageInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const label = categorizePlaidSpend(row);

    if (ageInDays <= 30) {
      spendingByRange.monthly.set(label, (spendingByRange.monthly.get(label) ?? 0) + amount);
      comparisonSpending.monthly += amount;
    }

    if (ageInDays <= 90) {
      spendingByRange.threeMonths.set(
        label,
        (spendingByRange.threeMonths.get(label) ?? 0) + amount
      );
      comparisonSpending.threeMonths += amount;
    }

    if (ageInDays <= 180) {
      spendingByRange.sixMonths.set(label, (spendingByRange.sixMonths.get(label) ?? 0) + amount);
      comparisonSpending.sixMonths += amount;
    }

    if (ageInDays <= 365) {
      spendingByRange.yearly.set(label, (spendingByRange.yearly.get(label) ?? 0) + amount);
      comparisonSpending.yearly += amount;
    }

    if (date.getFullYear() === currentYear) {
      spendingByRange.yearToDate.set(label, (spendingByRange.yearToDate.get(label) ?? 0) + amount);
      comparisonSpending.yearToDate += amount;
    }
  }

  const plaidSpendingBreakdown = Object.fromEntries(
    Object.entries(spendingByRange).map(([rangeKey, valueMap]) => [
      rangeKey,
      Array.from(valueMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value),
    ])
  ) as Record<SpendingRangeKey, SpendingBreakdownItem[]>;
  const monthlyHousingSpend = spendingByRange.monthly.get('Rent / Mortgage') ?? 0;

  const budgetCaps: BudgetCaps = {
    food: Number(profile.monthlyFoodBudget) || 0,
    transport: Number(profile.monthlyTransport) || 0,
    utilities: Number(profile.monthlyUtilities) || 0,
    entertainment: Number(profile.monthlyEntertainment) || 0,
    subscriptions: Number(profile.monthlyPlans) || 0,
    donations: Number(profile.monthlyDonations) || 0,
  };

  const plaidCurrentSavings = dedupedLinkedAccounts.reduce((total, account) => {
    if (!isSavingsAccount(account)) {
      return total;
    }

    const balance =
      account.current_balance !== null && account.current_balance !== ''
        ? Number(account.current_balance)
        : account.available_balance !== null && account.available_balance !== ''
          ? Number(account.available_balance)
          : 0;

    return total + (Number.isFinite(balance) ? Math.max(balance, 0) : 0);
  }, 0);

  const profileWithSyncedSavings = {
    ...profile,
    currentSavings: String(plaidCurrentSavings),
  };

  const report = buildFinancialReport(profileWithSyncedSavings, {
    monthlyExpensesOverride: hasPlaidExpenseHistory ? plaidMonthlyExpenses : 0,
    currentSavingsOverride: plaidCurrentSavings,
    monthlyHousingOverride: monthlyHousingSpend,
    expenseSourceNote: hasPlaidExpenseHistory
      ? 'Based on the last 30 days of synced Plaid transactions, including pending activity'
      : 'No synced Plaid spending history yet',
  });
  const actualNetCashflow = actualPaycheckInflows - report.monthlyExpenses + transactionNet;

  return {
    userId: user.id,
    profile: profileWithSyncedSavings,
    report,
    actualPaycheckInflows,
    actualNetCashflow,
    actualIncomeSourceNote: hasActualPaycheckHistory
      ? profile.employerName
        ? `Based on the last 30 days of Plaid inflows matched to ${profile.employerName} or payroll-like descriptors`
        : 'Based on the last 30 days of Plaid inflows matched to payroll-like descriptors'
      : 'No paycheck-like Plaid inflows detected yet',
    hasConnectedPlaidItem,
    linkedAccounts: dedupedLinkedAccounts,
    transactionEntries: transactionResult.rows,
    transactionNet,
    plaidTransactions: orderedPlaidTransactions.slice(0, 12),
    plaidSpendingBreakdown,
    comparisonSpending,
    budgetCaps,
  };
}
