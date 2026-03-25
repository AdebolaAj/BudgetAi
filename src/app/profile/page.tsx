import Link from 'next/link';
import PlaidSyncButton from '@/components/PlaidSyncButton';
import TransactionEntryForm from '@/components/TransactionEntryForm';
import { formatCurrency } from '@/lib/financialProfile';
import { getProfileData } from '@/lib/profileData';
import SignOutButton from '@/components/SignOutButton';

export default async function ProfilePage() {
  const data = await getProfileData();

  if (!data) {
    return (
      <main className="min-h-screen px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel rounded-[2.5rem] p-10 text-center">
            <span className="section-label text-amber-700">Sign In Required</span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
              Your financial dashboard is waiting.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              Sign in or create an account first so BudgetAI can load your saved financial profile
              and generate your report.
            </p>
            <Link href="/" className="primary-button mt-8 px-8 py-4 text-base">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { profile, report, transactionEntries, transactionNet, plaidTransactions } = data;
  const missingProfileFields = [
    !profile.phoneNumber ? 'phone number' : null,
    !profile.address ? 'address' : null,
    !profile.taxStatus ? 'tax status' : null,
  ].filter(Boolean) as string[];

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel rounded-[2.75rem] px-8 py-10 sm:px-10">
          <div className="flex items-start justify-between gap-4">
            <span className="section-label text-teal-800">Your Dashboard</span>
            <TransactionEntryForm />
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {profile.fullName ? `${profile.fullName.split(' ')[0]}'s initial report` : 'A calmer view of your finances.'}
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                This report is built from the financial profile you submitted during onboarding and
                now estimates take-home pay after taxes and pre-tax insurance before comparing that
                amount against your monthly costs and savings goals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <Link href="/setup" className="primary-button px-6 py-3 text-sm whitespace-nowrap">
                Update Financial Profile
              </Link>
              <Link href="/report" className="primary-button px-6 py-3 text-sm whitespace-nowrap">
                Initial Report Ready
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="surface-card rounded-[2.5rem] p-8">
            <div className="accent-ring inline-flex h-20 w-20 items-center justify-center rounded-full bg-teal-950 text-3xl font-semibold text-amber-300">
              {report.initials}
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-950">{report.fullName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {profile.userLocation || profile.workLocation
                ? `${profile.userLocation || 'Unknown location'}${profile.workLocation ? ` • Works from ${profile.workLocation}` : ''}`
                : 'Your profile is set up and ready for more detailed planning.'}
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-sm uppercase tracking-[0.22em] text-white/65">Current focus</p>
                <p className="mt-3 text-2xl font-semibold">{report.currentFocus}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{report.focusMessage}</p>
              </div>
              <div className="rounded-[1.5rem] bg-teal-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                  Next recommendation
                </p>
                <p className="mt-2 text-base leading-7 text-slate-700">{report.recommendation}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Savings Snapshot
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <span>Current savings</span>
                  <span className="font-semibold text-slate-950">
                    {formatCurrency(report.currentSavings, profile.currency || 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Annual goal</span>
                  <span className="font-semibold text-slate-950">
                    {formatCurrency(report.annualSavingsGoal, profile.currency || 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Goal gap</span>
                  <span className="font-semibold text-slate-950">
                    {formatCurrency(report.savingsGap, profile.currency || 'USD')}
                  </span>
                </div>
              </div>
            </div>

            <SignOutButton />
          </aside>

          <div className="space-y-8">
            {missingProfileFields.length > 0 && (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                      Profile update needed
                    </p>
                    <p className="mt-2 text-base leading-7 text-slate-700">
                      Add your {missingProfileFields.join(', ')} to complete your financial profile.
                    </p>
                  </div>
                  <Link href="/setup" className="primary-button px-6 py-3 text-sm whitespace-nowrap">
                    Update Profile
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {report.stats.map((stat) => (
                <div key={stat.label} className="surface-card rounded-[2rem] p-6">
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${stat.tone}`}
                  >
                    {stat.label}
                  </div>
                  <p className="mt-5 text-4xl font-semibold text-slate-950">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{stat.note}</p>
                </div>
              ))}
            </div>

            <section className="surface-card rounded-[2.5rem] p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Balance adjustments
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold text-slate-950">
                    Recent credit and debit entries.
                  </h3>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  Net impact {formatCurrency(transactionNet, profile.currency)}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {transactionEntries.length > 0 ? (
                  transactionEntries.map((entry) => {
                    const isCredit = entry.entry_type === 'credit';
                    return (
                      <div
                        key={entry.id}
                        className="rounded-[1.5rem] bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                                  isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {entry.entry_type}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                {entry.category}
                              </span>
                            </div>
                            <h4 className="mt-3 text-xl font-semibold text-slate-950">{entry.title}</h4>
                            {entry.notes && (
                              <p className="mt-2 text-sm leading-6 text-slate-600">{entry.notes}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-2xl font-semibold ${
                                isCredit ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {isCredit ? '+' : '-'}
                              {formatCurrency(Number(entry.amount), profile.currency)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{entry.occurred_on}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
                    No credit or debit entries yet. Add your first manual adjustment to change the reported balance.
                  </div>
                )}
              </div>
            </section>

            <section className="surface-card rounded-[2.5rem] p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Linked account activity
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold text-slate-950">
                    Recent Plaid transactions.
                  </h3>
                </div>
                <PlaidSyncButton />
              </div>

              <div className="mt-8 space-y-4">
                {plaidTransactions.length > 0 ? (
                  plaidTransactions.map((transaction) => (
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
                            {transaction.category_detailed ? ` • ${transaction.category_detailed.replaceAll('_', ' ')}` : ''}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-semibold text-slate-950">
                            {formatCurrency(Number(transaction.amount), transaction.iso_currency_code || profile.currency)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{transaction.date}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
                    No Plaid transactions synced yet. Connect a bank account and refresh transactions to pull recent activity.
                  </div>
                )}
              </div>
            </section>

          </div>
        </section>
      </div>
    </main>
  );
}
