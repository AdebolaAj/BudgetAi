import Link from 'next/link';
import CurrentFocusDeepDive from '@/components/CurrentFocusDeepDive';
import PlaidSyncButton from '@/components/PlaidSyncButton';
import PlaidTransactionsList from '@/components/PlaidTransactionsList';
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

  const {
    profile,
    report,
    actualNetCashflow,
    hasConnectedPlaidItem,
    linkedAccounts,
    plaidTransactions,
  } = data;
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
            <Link
              href="/settings"
              aria-label="Open account settings"
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {report.fullName
                  ? `${report.fullName.split(' ')[0]}'s initial report`
                  : 'A calmer view of your finances.'}
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Building reports based on your financial data tracking 
                paycheck inflows, spending, and other cashflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <Link href="/report" className="primary-button px-6 py-3 text-sm whitespace-nowrap">
                Initial Report Ready
              </Link>
              <TransactionEntryForm triggerClassName="primary-button px-6 py-3 text-sm whitespace-nowrap" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="surface-card self-start rounded-[2.5rem] p-8">
            <div className="accent-ring inline-flex h-20 w-20 items-center justify-center rounded-full bg-teal-950 text-3xl font-semibold text-amber-300">
              {report.initials}
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-950">{report.fullName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {profile.userLocation || profile.workLocation
                ? `${profile.userLocation || 'Unknown location'}${profile.workLocation ? ` • Works at ${profile.workLocation}` : ''}`
                : 'Your profile is set up and ready for more detailed planning.'}
            </p>

            <div className="mt-8 space-y-4">
              <CurrentFocusDeepDive
                currentFocus={report.currentFocus}
                focusMessage={report.focusMessage}
              />
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
                <p className="text-xs leading-6 text-slate-500">
                  Based on the balances of your linked savings accounts.
                </p>
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
              <div className="surface-card rounded-[2rem] p-6">
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                    actualNetCashflow >= 0 ? 'bg-sky-50 text-sky-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  Actual Net Cashflow
                </div>
                <p className="mt-5 text-4xl font-semibold text-slate-950">
                  {formatCurrency(actualNetCashflow, profile.currency)}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Paycheck inflows minus synced spending, plus money gained.
                </p>
              </div>

              {report.stats
                .filter(
                  (stat) =>
                    !['Gross Income', 'Estimated Taxes', 'Net Monthly Income'].includes(stat.label)
                )
                .map((stat) => (
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
                    Linked account activity
                  </p>
                  <h3 className="mt-3 text-3xl font-semibold text-slate-950">
                    Recent bank transactions.
                  </h3>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Link href="/accounts" className="secondary-button px-5 py-3 text-sm whitespace-nowrap">
                    View Bank Reports
                  </Link>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                    {linkedAccounts.length} account{linkedAccounts.length === 1 ? '' : 's'}
                  </span>
                  <PlaidSyncButton
                    autoSyncOnMount={hasConnectedPlaidItem && plaidTransactions.length === 0}
                  />
                </div>
              </div>

              <div className="mt-8">
                <PlaidTransactionsList transactions={plaidTransactions} currency={profile.currency} />
              </div>
            </section>

          </div>
        </section>
      </div>
    </main>
  );
}
