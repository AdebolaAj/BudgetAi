import Link from 'next/link';
import SpendingChartSection from '@/components/SpendingChartSection';
import { formatCurrency } from '@/lib/financialProfile';
import { getProfileData } from '@/lib/profileData';

export default async function ReportPage() {
  const data = await getProfileData();

  if (!data) {
    return (
      <main className="min-h-screen px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel rounded-[2.5rem] p-10 text-center">
            <span className="section-label text-amber-700">Sign In Required</span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
              Your initial report is locked until you sign in.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              Sign in first so BudgetAI can load your saved financial profile and generate your report.
            </p>
            <Link href="/" className="primary-button mt-8 px-8 py-4 text-base">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { profile, report, plaidSpendingBreakdown, comparisonSpending, budgetCaps } = data;
  const savingsGoalProgress = report.annualSavingsGoal > 0
    ? Math.min((report.currentSavings / report.annualSavingsGoal) * 100, 100)
    : 0;
  const monthsToGoal =
    report.monthlyBalance > 0 && report.savingsGap > 0
      ? Math.ceil(report.savingsGap / report.monthlyBalance)
      : null;

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel rounded-[2.75rem] px-8 py-10 sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <span className="section-label text-slate-600">Initial Report</span>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                The first read on your financial picture.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                This view expands the summary into your goal progress, monthly spending pattern,
                and projected comparisons across multiple time windows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <Link href="/profile" className="secondary-button px-6 py-3 text-sm whitespace-nowrap">
                Back to Dashboard
              </Link>
              <div className="rounded-full bg-amber-100 px-6 py-3 text-sm font-bold text-amber-700 whitespace-nowrap">
                Savings rate {report.savingsRate}%
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-8">
            <div className="surface-card rounded-[2.5rem] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Goal</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                {report.annualSavingsGoal > 0
                  ? formatCurrency(report.annualSavingsGoal, profile.currency)
                  : 'No savings goal set yet'}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-700">
                {report.annualSavingsGoal > 0
                  ? 'Your current annual savings target against the balances in your linked savings accounts.'
                  : 'Add a savings goal in the financial profile to track progress here.'}
              </p>

              {report.annualSavingsGoal > 0 && (
                <>
                  <div className="mt-6 h-3 rounded-full bg-slate-200">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500"
                      style={{ width: `${savingsGoalProgress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {Math.round(savingsGoalProgress)}% of your annual goal is already funded by linked savings balances.
                  </p>
                </>
              )}
            </div>

            <div className="surface-card rounded-[2.5rem] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                How much left
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                {formatCurrency(report.savingsGap, profile.currency)}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-700">
                {report.savingsGap > 0
                  ? 'This is the remaining distance between your current savings and the goal you entered.'
                  : 'You have already met or exceeded your current savings goal.'}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Projected surplus
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatCurrency(report.monthlyBalance, profile.currency)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Time to goal
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {monthsToGoal ? `${monthsToGoal} mo` : 'Needs review'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <SpendingChartSection
            currency={profile.currency}
            breakdowns={plaidSpendingBreakdown}
            comparisonSpending={comparisonSpending}
            budgetCaps={budgetCaps}
          />
        </section>

      </div>
    </main>
  );
}
