'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/financialProfile';
import type { BudgetCaps, SpendingBreakdownItem, SpendingRangeKey } from '@/lib/profileData';

type SpendingChartSectionProps = {
  currency: string;
  breakdowns: Record<SpendingRangeKey, SpendingBreakdownItem[]>;
  comparisonSpending: {
    monthly: number;
    threeMonths: number;
    sixMonths: number;
    yearly: number;
    yearToDate: number;
  };
  budgetCaps: BudgetCaps;
};

type RangeOption = {
  key: SpendingRangeKey;
  label: string;
  capMultiplier: number;
};

const rangeOptions: RangeOption[] = [
  { key: 'monthly', label: 'Month', capMultiplier: 1 },
  { key: 'threeMonths', label: '3 Mo', capMultiplier: 3 },
  { key: 'sixMonths', label: '6 Mo', capMultiplier: 6 },
  { key: 'yearly', label: 'Year', capMultiplier: 12 },
  { key: 'yearToDate', label: 'YTD', capMultiplier: new Date().getMonth() + 1 },
];

function getBudgetCapForLabel(label: string, budgetCaps: BudgetCaps) {
  const normalized = label.trim().toUpperCase();

  if (normalized.includes('FOOD')) return budgetCaps.food;
  if (normalized.includes('TRANSPORT') || normalized.includes('TRAVEL')) return budgetCaps.transport;
  if (normalized.includes('UTILITY')) return budgetCaps.utilities;
  if (normalized.includes('ENTERTAINMENT') || normalized.includes('DINING')) return budgetCaps.entertainment;
  if (normalized.includes('SUBSCRIPTION')) return budgetCaps.subscriptions;
  if (normalized.includes('DONATION')) return budgetCaps.donations;

  return null;
}

export default function SpendingChartSection({
  currency,
  breakdowns,
  comparisonSpending,
  budgetCaps,
}: SpendingChartSectionProps) {
  const [selectedRange, setSelectedRange] = useState<SpendingRangeKey>('monthly');
  const currentRange = rangeOptions.find((option) => option.key === selectedRange) ?? rangeOptions[0];
  const spendingBreakdown = breakdowns[selectedRange] ?? [];
  const maxSpendingValue = Math.max(...spendingBreakdown.map((item) => item.value), 1);
  const totalSpending = comparisonSpending[selectedRange] ?? 0;

  return (
    <div className="surface-card rounded-[2.5rem] p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Monthly spending
          </p>
          <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight text-slate-950">
            Where the money goes.
          </h2>
        </div>
        <div className="min-w-0 flex flex-col items-end gap-2 lg:flex-1">
          <div className="flex w-full flex-nowrap items-center justify-end gap-1 overflow-hidden">
            {rangeOptions.map((option) => {
              const active = option.key === selectedRange;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedRange(option.key)}
                  className={
                    active
                      ? 'primary-button shrink-0 px-2.5 py-1.5 text-[12px]'
                      : 'secondary-button shrink-0 px-2.5 py-1.5 text-[12px]'
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Total {formatCurrency(totalSpending, currency)}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {spendingBreakdown.length > 0 ? (
          spendingBreakdown.map((item) => {
            const baseBudgetValue = getBudgetCapForLabel(item.label, budgetCaps) ?? 0;
            const budgetValue = baseBudgetValue * currentRange.capMultiplier;
            const hasExpectedCap = budgetValue > 0;
            const isOverBudget = hasExpectedCap ? item.value > budgetValue : false;
            const overBy = isOverBudget ? item.value - budgetValue : 0;

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className={`text-sm font-semibold ${isOverBudget ? 'text-red-700' : 'text-slate-950'}`}>
                    {formatCurrency(item.value, currency)}
                  </p>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className={
                      isOverBudget
                        ? 'h-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500'
                        : 'h-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500'
                    }
                    style={{ width: `${Math.max((item.value / maxSpendingValue) * 100, 10)}%` }}
                  />
                </div>
                {hasExpectedCap ? (
                  <p className={`mt-2 text-sm ${isOverBudget ? 'text-red-700' : 'text-slate-500'}`}>
                    {isOverBudget
                      ? `Expected cap ${formatCurrency(budgetValue, currency)} • Over by ${formatCurrency(overBy, currency)}`
                      : `Expected cap ${formatCurrency(budgetValue, currency)}`}
                  </p>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
            Connect Plaid and sync transactions to populate the spending chart from actual account history.
          </div>
        )}
      </div>
    </div>
  );
}
