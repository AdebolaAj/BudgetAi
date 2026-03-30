'use client';

import { useMemo, useState } from 'react';
import PlaidConnectButton from '@/components/PlaidConnectButton';
import ReportModal from '@/components/ReportModal';
import { formatCurrency } from '@/lib/financialProfile';
import type { LinkedPlaidAccount } from '@/lib/profileData';

type LinkedAccountsSectionProps = {
  accounts: LinkedPlaidAccount[];
  defaultCurrency: string;
};

type AccountGroup = {
  plaidItemId: string;
  institutionName: string;
  accounts: LinkedPlaidAccount[];
};

function getBalanceLabel(account: LinkedPlaidAccount, defaultCurrency: string) {
  const currency = account.iso_currency_code || defaultCurrency;
  const hasCurrentBalance = account.current_balance !== null && account.current_balance !== '';
  const hasAvailableBalance = account.available_balance !== null && account.available_balance !== '';

  if (hasCurrentBalance) {
    return formatCurrency(Number(account.current_balance), currency);
  }

  if (hasAvailableBalance) {
    return formatCurrency(Number(account.available_balance), currency);
  }

  return 'Balance unavailable';
}

function getInstitutionSummary(accounts: LinkedPlaidAccount[]) {
  const activeAccounts = accounts.filter((account) => account.is_active);
  const selectedAccounts = accounts.filter((account) => account.is_selected);
  const creditAccounts = accounts.filter((account) => account.type === 'credit').length;
  const depositoryAccounts = accounts.filter((account) => account.type === 'depository').length;

  return {
    activeAccounts: activeAccounts.length,
    selectedAccounts: selectedAccounts.length,
    creditAccounts,
    depositoryAccounts,
  };
}

export default function LinkedAccountsSection({
  accounts,
  defaultCurrency,
}: LinkedAccountsSectionProps) {
  const [openInstitutionId, setOpenInstitutionId] = useState<string | null>(null);

  const groupedAccounts = useMemo(() => {
    const accountsByItem = new Map<string, AccountGroup>();

    for (const account of accounts) {
      const existing = accountsByItem.get(account.plaid_item_id);

      if (existing) {
        existing.accounts.push(account);
        continue;
      }

      accountsByItem.set(account.plaid_item_id, {
        plaidItemId: account.plaid_item_id,
        institutionName: account.institution_name || 'Linked institution',
        accounts: [account],
      });
    }

    return Array.from(accountsByItem.values()).sort((left, right) =>
      left.institutionName.localeCompare(right.institutionName)
    );
  }, [accounts]);

  const openInstitution =
    groupedAccounts.find((group) => group.plaidItemId === openInstitutionId) ?? null;

  if (!groupedAccounts.length) {
    return (
      <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
        No linked accounts yet. Connect a bank to start building combined and account-level views.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {groupedAccounts.map((group) => {
          const summary = getInstitutionSummary(group.accounts);

          return (
            <div key={group.plaidItemId} className="rounded-[1.75rem] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                    {group.institutionName}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {summary.selectedAccounts} shared account
                    {summary.selectedAccounts === 1 ? '' : 's'}
                  </p>
                </div>
                <PlaidConnectButton
                  plaidItemId={group.plaidItemId}
                  buttonLabel="Manage Accounts"
                  initialHasConnectedItem
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Active
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.activeAccounts}</p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Credit / Deposit
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {summary.creditAccounts} / {summary.depositoryAccounts}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Account details</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Open the institution view to inspect each linked account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenInstitutionId(group.plaidItemId)}
                  className="secondary-button shrink-0 px-4 py-2.5 text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ReportModal
        isOpen={Boolean(openInstitution)}
        onClose={() => setOpenInstitutionId(null)}
      >
        {openInstitution ? (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Linked accounts
                </p>
                <h3 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {openInstitution.institutionName}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Detailed view of the accounts currently shared from this institution.
                </p>
              </div>
              <PlaidConnectButton
                plaidItemId={openInstitution.plaidItemId}
                buttonLabel="Manage Shared Accounts"
                initialHasConnectedItem
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {openInstitution.accounts.map((account) => (
                <div
                  key={account.account_id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        {account.official_name || account.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {account.type}
                        {account.subtype ? ` • ${account.subtype}` : ''}
                        {account.mask ? ` • •••• ${account.mask}` : ''}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        account.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {account.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[1rem] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Balance
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {getBalanceLabel(account, defaultCurrency)}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Selected
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {account.is_selected ? 'Shared with BudgetAI' : 'Not selected'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ReportModal>
    </>
  );
}
