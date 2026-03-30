import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getProfileData, type BudgetCaps, type SpendingBreakdownItem } from '@/lib/profileData';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';

type DeepDiveResponse = {
  summary: string;
  whyThisFocus: string;
  mainDrivers: string[];
  actionPlan: Array<{
    title: string;
    detail: string;
  }>;
  watchouts: string[];
};

function getBudgetCapForLabel(label: string, budgetCaps: BudgetCaps) {
  const normalized = label.trim().toUpperCase();

  if (normalized.includes('FOOD')) return budgetCaps.food;
  if (normalized.includes('TRANSPORT') || normalized.includes('TRAVEL')) return budgetCaps.transport;
  if (normalized.includes('UTILITY')) return budgetCaps.utilities;
  if (normalized.includes('ENTERTAINMENT') || normalized.includes('DINING')) return budgetCaps.entertainment;
  if (normalized.includes('SUBSCRIPTION')) return budgetCaps.subscriptions;
  if (normalized.includes('DONATION')) return budgetCaps.donations;

  return 0;
}

function getOverspendingContext(monthlyBreakdown: SpendingBreakdownItem[], budgetCaps: BudgetCaps) {
  return monthlyBreakdown
    .map((item) => {
      const cap = getBudgetCapForLabel(item.label, budgetCaps);
      return {
        label: item.label,
        spent: Math.round(item.value * 100) / 100,
        cap,
        overBy: Math.round(Math.max(item.value - cap, 0) * 100) / 100,
      };
    })
    .filter((item) => item.cap > 0 && item.spent > item.cap)
    .sort((left, right) => right.overBy - left.overBy)
    .slice(0, 4);
}

const deepDiveSchema = {
  name: 'focus_deep_dive',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      whyThisFocus: { type: 'string' },
      mainDrivers: {
        type: 'array',
        items: { type: 'string' },
      },
      actionPlan: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            detail: { type: 'string' },
          },
          required: ['title', 'detail'],
        },
      },
      watchouts: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['summary', 'whyThisFocus', 'mainDrivers', 'actionPlan', 'watchouts'],
  },
} as const;

export async function GET() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getProfileData();

    if (!data) {
      return NextResponse.json({ error: 'Unable to load financial context.' }, { status: 400 });
    }

    const monthlyBreakdown = data.plaidSpendingBreakdown.monthly ?? [];
    const overspendingCategories = getOverspendingContext(monthlyBreakdown, data.budgetCaps);
    const topSpendingCategories = monthlyBreakdown.slice(0, 5).map((item) => ({
      label: item.label,
      spent: Math.round(item.value * 100) / 100,
    }));

    const factualContext = {
      fullName: data.report.fullName,
      currentFocus: data.report.currentFocus,
      focusMessage: data.report.focusMessage,
      recommendation: data.report.recommendation,
      actualPaycheckInflows30d: Math.round(data.actualPaycheckInflows * 100) / 100,
      actualNetCashflow30d: Math.round(data.actualNetCashflow * 100) / 100,
      actualExpenses30d: Math.round(data.report.monthlyExpenses * 100) / 100,
      projectedBalance30d: Math.round(data.report.projectedMonthlyBalance * 100) / 100,
      currentSavings: Math.round(data.report.currentSavings * 100) / 100,
      annualSavingsGoal: Math.round(data.report.annualSavingsGoal * 100) / 100,
      savingsGap: Math.round(data.report.savingsGap * 100) / 100,
      monthlyCaps: data.budgetCaps,
      overspendingCategories,
      topSpendingCategories,
      actualIncomeSourceNote: data.actualIncomeSourceNote,
      expenseSourceNote: data.report.expenseSourceNote,
      currency: data.profile.currency,
    };

    const response = await getOpenAIClient().responses.create({
      model: getOpenAIModel(),
      instructions:
        'You are BudgetAI\'s financial coaching assistant. Only use the numeric facts explicitly provided in the JSON context. Do not invent any dollar amounts, percentages, savings estimates, or timelines. You may restate provided numbers and do simple arithmetic differences already supplied in the context, but do not introduce new unsupported calculations. Keep the advice practical, specific, concise, and tied directly to the provided spending categories and cashflow facts. If data is missing, say it is unavailable instead of guessing.',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Generate a deeper dive for the user's current financial focus using only this JSON context:\n${JSON.stringify(factualContext, null, 2)}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: deepDiveSchema.name,
          schema: deepDiveSchema.schema,
          strict: deepDiveSchema.strict,
        },
      },
    });

    const deepDive = JSON.parse(response.output_text) as DeepDiveResponse;

    return NextResponse.json({ deepDive });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to generate the focus deep dive.') },
      { status: 500 }
    );
  }
}
