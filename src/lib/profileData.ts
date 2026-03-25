import { getCurrentSessionUser } from '@/lib/auth';
import { getPool, ensureDatabaseSetup } from '@/lib/db';
import {
  buildFinancialReport,
  financialProfileFromRow,
  formatCurrency,
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

export type SpendingBreakdownItem = {
  label: string;
  value: number;
};

export type SpendingComparisonTotals = {
  monthly: number;
  threeMonths: number;
  sixMonths: number;
  yearly: number;
};

export type BudgetCaps = {
  food: number;
  transport: number;
  entertainment: number;
  subscriptions: number;
  donations: number;
};

type PlaidSpendingRow = {
  amount: string;
  date: string;
  category_primary: string;
};

function categorizePlaidSpend(categoryPrimary: string) {
  const normalized = categoryPrimary.trim().toUpperCase();

  if (!normalized) return 'Other';
  if (normalized.includes('FOOD') || normalized.includes('DINING')) return 'Food';
  if (normalized.includes('TRANSPORT')) return 'Transport';
  if (normalized.includes('RENT') || normalized.includes('MORTGAGE') || normalized.includes('HOUSING'))
    return 'Rent / Mortgage';
  if (normalized.includes('UTILITY')) return 'Utilities';
  if (normalized.includes('GENERAL_MERCHANDISE') || normalized.includes('GENERAL SERVICES'))
    return 'Bills';
  if (normalized.includes('ENTERTAINMENT') || normalized.includes('RECREATION')) return 'Entertainment';
  if (normalized.includes('INCOME')) return 'Income';

  return categoryPrimary
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
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
      LIMIT 12
    `,
    [user.id]
  );

  const plaidExpenseAggregate = await pool.query<{ total: string }>(
    `
      SELECT COALESCE(SUM(amount), 0)::text AS total
      FROM plaid_transactions
      WHERE user_id = $1
        AND pending = FALSE
        AND amount > 0
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    `,
    [user.id]
  );

  const plaidMonthlyExpenses = Number(plaidExpenseAggregate.rows[0]?.total ?? '0');
  const hasPlaidExpenseHistory = plaidMonthlyExpenses > 0;

  const plaidSpendingRows = await pool.query<PlaidSpendingRow>(
    `
      SELECT amount::text, date::text, category_primary
      FROM plaid_transactions
      WHERE user_id = $1
        AND pending = FALSE
        AND amount > 0
        AND date >= CURRENT_DATE - INTERVAL '365 days'
    `,
    [user.id]
  );

  const now = new Date();
  const spendingByLabel = new Map<string, number>();
  const comparisonSpending: SpendingComparisonTotals = {
    monthly: 0,
    threeMonths: 0,
    sixMonths: 0,
    yearly: 0,
  };

  for (const row of plaidSpendingRows.rows) {
    const amount = Number(row.amount) || 0;
    const date = new Date(row.date);
    const ageInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (ageInDays <= 30) {
      const label = categorizePlaidSpend(row.category_primary);
      spendingByLabel.set(label, (spendingByLabel.get(label) ?? 0) + amount);
      comparisonSpending.monthly += amount;
    }

    if (ageInDays <= 90) {
      comparisonSpending.threeMonths += amount;
    }

    if (ageInDays <= 180) {
      comparisonSpending.sixMonths += amount;
    }

    if (ageInDays <= 365) {
      comparisonSpending.yearly += amount;
    }
  }

  const plaidSpendingBreakdown = Array.from(spendingByLabel.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);

  const budgetCaps: BudgetCaps = {
    food: Number(profile.monthlyFoodBudget) || 0,
    transport: Number(profile.monthlyTransport) || 0,
    entertainment: Number(profile.monthlyEntertainment) || 0,
    subscriptions: Number(profile.monthlyPlans) || 0,
    donations: Number(profile.monthlyDonations) || 0,
  };

  const report = buildFinancialReport(profile, {
    monthlyExpensesOverride: hasPlaidExpenseHistory ? plaidMonthlyExpenses : 0,
    expenseSourceNote: hasPlaidExpenseHistory
      ? 'Based on the last 30 days of synced Plaid transactions'
      : 'No synced Plaid spending history yet',
  });
  const adjustedMonthlyBalance = report.monthlyBalance + transactionNet;

  return {
    userId: user.id,
    profile,
    report: {
      ...report,
      monthlyBalance: adjustedMonthlyBalance,
      stats: report.stats.map((stat) =>
        stat.label === 'Balance'
          ? {
              ...stat,
              value: formatCurrency(adjustedMonthlyBalance, profile.currency),
              note:
                transactionNet !== 0
                  ? `${transactionNet > 0 ? 'Includes' : 'Reduced by'} ${Math.abs(transactionNet).toFixed(2)} from logged entries`
                  : stat.note,
            }
          : stat
      ),
    },
    transactionEntries: transactionResult.rows,
    transactionNet,
    plaidTransactions: plaidTransactionResult.rows,
    plaidSpendingBreakdown,
    comparisonSpending,
    budgetCaps,
  };
}
