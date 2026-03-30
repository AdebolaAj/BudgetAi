'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/financialProfile';
import type { PlaidTransaction } from '@/lib/profileData';

type PlaidTransactionsListProps = {
  transactions: PlaidTransaction[];
  currency: string;
};

const INITIAL_VISIBLE_COUNT = 5;

export default function PlaidTransactionsList({
  transactions,
  currency,
}: PlaidTransactionsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleTransactions = isExpanded
    ? transactions
    : transactions.slice(0, INITIAL_VISIBLE_COUNT);

  if (!transactions.length) {
    return (
      <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
        No bank transactions synced yet. Connect a bank account and refresh transactions to pull recent activity.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleTransactions.map((transaction) => (
        <div key={transaction.transaction_id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {transaction.institution_name ? (
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                    {transaction.institution_name}
                  </span>
                ) : null}
                {transaction.category_primary ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {transaction.category_primary.replaceAll('_', ' ')}
                  </span>
                ) : null}
                {transaction.pending ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Pending
                  </span>
                ) : null}
              </div>
              <h4 className="mt-3 text-xl font-semibold text-slate-950">
                {transaction.merchant_name || transaction.name}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {transaction.name}
                {transaction.category_detailed
                  ? ` • ${transaction.category_detailed.replaceAll('_', ' ')}`
                  : ''}
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold text-slate-950">
                {formatCurrency(Number(transaction.amount), transaction.iso_currency_code || currency)}
              </p>
              <p className="mt-1 text-sm text-slate-500">{transaction.date}</p>
            </div>
          </div>
        </div>
      ))}

      {transactions.length > INITIAL_VISIBLE_COUNT ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="secondary-button px-5 py-3 text-sm"
          >
            {isExpanded ? 'Show Less' : `View More (${transactions.length - INITIAL_VISIBLE_COUNT})`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
