'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/financialProfile';

type RangeKey = 'monthly' | '3months' | '6months' | 'yearly';

const rangeOptions: Array<{ key: RangeKey; label: string; months: number }> = [
  { key: 'monthly', label: 'Monthly', months: 1 },
  { key: '3months', label: '3 Months', months: 3 },
  { key: '6months', label: '6 Months', months: 6 },
  { key: 'yearly', label: 'Yearly', months: 12 },
];

type ReportComparisonsProps = {
  currency: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  annualSavingsGoal: number;
  currentSavings: number;
};

export default function ReportComparisons({
  currency,
  monthlyIncome,
  monthlyExpenses,
  monthlyBalance,
  annualSavingsGoal,
  currentSavings,
}: ReportComparisonsProps) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>('monthly');
  const currentRange = rangeOptions.find((option) => option.key === selectedRange) ?? rangeOptions[0];

  const income = monthlyIncome * currentRange.months;
  const expenses = monthlyExpenses * currentRange.months;
  const surplus = monthlyBalance * currentRange.months;
  const goalTarget = (annualSavingsGoal / 12) * currentRange.months;
  const projectedSavings = Math.max(currentSavings + surplus, 0);

  return (
    <div className="surface-card rounded-[2.5rem] p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Comparisons
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-slate-950">
            Measure the plan across different horizons.
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {rangeOptions.map((option) => {
            const active = option.key === selectedRange;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRange(option.key)}
                className={
                  active
                    ? 'primary-button px-5 py-2.5 text-sm'
                    : 'secondary-button px-5 py-2.5 text-sm'
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Net income
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {formatCurrency(income, currency)}
          </p>
          <p className="mt-2 text-sm text-slate-600">Estimated take-home for the selected range.</p>
        </div>
        <div className="rounded-[1.75rem] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Spending
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {formatCurrency(expenses, currency)}
          </p>
          <p className="mt-2 text-sm text-slate-600">Projected recurring spend across the same period.</p>
        </div>
        <div className="rounded-[1.75rem] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Savings progress
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {formatCurrency(projectedSavings, currency)}
          </p>
          <p className="mt-2 text-sm text-slate-600">Current savings plus projected surplus.</p>
        </div>
        <div className="rounded-[1.75rem] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Goal target
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {formatCurrency(goalTarget, currency)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Savings pace expected for {currentRange.label.toLowerCase()}.
          </p>
        </div>
      </div>
    </div>
  );
}
