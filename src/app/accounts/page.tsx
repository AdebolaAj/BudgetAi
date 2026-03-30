import Link from 'next/link';
import LinkedAccountsSection from '@/components/LinkedAccountsSection';
import { getProfileData } from '@/lib/profileData';

export default async function AccountsPage() {
  const data = await getProfileData();

  if (!data) {
    return (
      <main className="min-h-screen px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel rounded-[2.5rem] p-10 text-center">
            <span className="section-label text-amber-700">Sign In Required</span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
              Your bank reports are waiting.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              Sign in first so BudgetAI can load your linked institutions and individual account
              views.
            </p>
            <Link href="/" className="primary-button mt-8 px-8 py-4 text-base">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { profile, linkedAccounts } = data;

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel rounded-[2.75rem] px-8 py-10 sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="section-label text-teal-800">Bank Reports</span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Review each linked institution separately.
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Keep the dashboard focused on cashflow and activity, then open this page when you
                want institution-level detail or account management.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <Link href="/profile" className="secondary-button px-6 py-3 text-sm whitespace-nowrap">
                Back to Dashboard
              </Link>
              <span className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                {linkedAccounts.length} linked account{linkedAccounts.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </section>

        <section className="surface-card rounded-[2.5rem] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Linked accounts
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Shared banks and cards.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Each institution stays summarized until you open its detail view, which keeps this
              page dense without getting unwieldy.
            </p>
          </div>

          <div className="mt-8">
            <LinkedAccountsSection accounts={linkedAccounts} defaultCurrency={profile.currency} />
          </div>
        </section>
      </div>
    </main>
  );
}
