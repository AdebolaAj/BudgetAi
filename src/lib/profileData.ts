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

  const report = buildFinancialReport(profile);
  const adjustedMonthlyBalance = report.monthlyBalance + transactionNet;

  return {
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
  };
}
