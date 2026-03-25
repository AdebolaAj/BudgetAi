import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getPool, ensureDatabaseSetup } from '@/lib/db';
import {
  financialProfileFromRow,
  getEmptyFinancialProfile,
  type FinancialProfile,
  type FinancialProfileRow,
} from '@/lib/financialProfile';

export async function GET() {
  try {
    await ensureDatabaseSetup();
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    if (!result.rows[0]) {
      return NextResponse.json({
        profile: getEmptyFinancialProfile(user.full_name),
      });
    }

    return NextResponse.json({
      profile: financialProfileFromRow(result.rows[0], user.full_name),
    });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to load financial profile.') },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDatabaseSetup();
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as FinancialProfile;
    const pool = getPool();

    await pool.query(
      `
        UPDATE users
        SET full_name = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [user.id, body.fullName.trim()]
    );

    await pool.query(
      `
        INSERT INTO financial_profiles (
          user_id,
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
          currency,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          phone_number = EXCLUDED.phone_number,
          address = EXCLUDED.address,
          tax_status = EXCLUDED.tax_status,
          frequency = EXCLUDED.frequency,
          salary = EXCLUDED.salary,
          user_location = EXCLUDED.user_location,
          work_location = EXCLUDED.work_location,
          current_savings = EXCLUDED.current_savings,
          monthly_rent = EXCLUDED.monthly_rent,
          monthly_bills = EXCLUDED.monthly_bills,
          monthly_food_budget = EXCLUDED.monthly_food_budget,
          monthly_transport = EXCLUDED.monthly_transport,
          monthly_utilities = EXCLUDED.monthly_utilities,
          monthly_insurance = EXCLUDED.monthly_insurance,
          monthly_plans = EXCLUDED.monthly_plans,
          monthly_donations = EXCLUDED.monthly_donations,
          monthly_entertainment = EXCLUDED.monthly_entertainment,
          savings_goal = EXCLUDED.savings_goal,
          investment_amount = EXCLUDED.investment_amount,
          emergency_fund = EXCLUDED.emergency_fund,
          currency = EXCLUDED.currency,
          updated_at = NOW()
      `,
      [
        user.id,
        body.phoneNumber,
        body.address,
        body.taxStatus,
        body.frequency,
        body.salary,
        body.userLocation,
        body.workLocation,
        body.currentSavings,
        body.monthlyRent,
        body.monthlyBills,
        body.monthlyFoodBudget,
        body.monthlyTransport,
        body.monthlyUtilities,
        body.monthlyInsurance,
        body.monthlyPlans,
        body.monthlyDonations,
        body.monthlyEntertainment,
        body.savingsGoal,
        body.investmentAmount,
        body.emergencyFund,
        body.currency,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to save financial profile.') },
      { status: 500 }
    );
  }
}
