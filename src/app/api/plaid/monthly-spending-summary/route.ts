import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { ensureDatabaseSetup, getPool } from '@/lib/db';

type PlaidBudgetRow = {
  amount: string;
  category_primary: string;
  category_detailed: string;
  name: string;
  merchant_name: string;
};

type BudgetSummary = {
  monthlyFoodBudget: number;
  monthlyTransport: number;
  monthlyEntertainment: number;
  monthlyPlans: number;
  monthlyDonations: number;
};

function getBudgetField(row: PlaidBudgetRow): keyof BudgetSummary | null {
  const primary = row.category_primary.trim().toUpperCase();
  const detailed = row.category_detailed.trim().toUpperCase();
  const name = `${row.name} ${row.merchant_name}`.toUpperCase();

  if (primary.includes('FOOD') || primary.includes('DINING')) return 'monthlyFoodBudget';
  if (primary.includes('TRANSPORT')) return 'monthlyTransport';
  if (primary.includes('ENTERTAINMENT') || primary.includes('RECREATION')) return 'monthlyEntertainment';
  if (detailed.includes('SUBSCRIPTION') || name.includes('NETFLIX') || name.includes('SPOTIFY'))
    return 'monthlyPlans';
  if (primary.includes('DONATION') || detailed.includes('DONATION') || detailed.includes('CHARITABLE'))
    return 'monthlyDonations';

  return null;
}

export async function GET() {
  try {
    await ensureDatabaseSetup();
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getPool().query<PlaidBudgetRow>(
      `
        SELECT amount::text, category_primary, category_detailed, name, merchant_name
        FROM plaid_transactions
        WHERE user_id = $1
          AND pending = FALSE
          AND amount > 0
          AND date >= CURRENT_DATE - INTERVAL '30 days'
      `,
      [user.id]
    );

    const summary: BudgetSummary = {
      monthlyFoodBudget: 0,
      monthlyTransport: 0,
      monthlyEntertainment: 0,
      monthlyPlans: 0,
      monthlyDonations: 0,
    };

    for (const row of result.rows) {
      const field = getBudgetField(row);
      if (!field) continue;
      summary[field] += Number(row.amount) || 0;
    }

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to load monthly Plaid spending summary.') },
      { status: 500 }
    );
  }
}
