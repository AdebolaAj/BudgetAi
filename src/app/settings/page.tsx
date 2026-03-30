import Link from 'next/link';
import AccountSettingsPanel from '@/components/AccountSettingsPanel';
import { getCurrentSessionUser } from '@/lib/auth';
import { ensureDatabaseSetup, getPool } from '@/lib/db';
import { formatPersonName } from '@/lib/financialProfile';

export default async function SettingsPage() {
  await ensureDatabaseSetup();
  const user = await getCurrentSessionUser();

  if (!user) {
    return (
      <main className="min-h-screen px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel rounded-[2.5rem] p-10 text-center">
            <span className="section-label text-amber-700">Sign In Required</span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
              Your settings are locked until you sign in.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              Sign in first so BudgetAI can load your account controls and preferences.
            </p>
            <Link href="/" className="primary-button mt-8 px-8 py-4 text-base">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const pool = getPool();
  const [{ institution_count = '0', account_count = '0' } = { institution_count: '0', account_count: '0' }] = (
    await pool.query<{ institution_count: string; account_count: string }>(
      `
        SELECT
          COUNT(DISTINCT plaid_item_id)::text AS institution_count,
          COUNT(*)::text AS account_count
        FROM plaid_accounts
        WHERE user_id = $1
          AND is_selected = TRUE
          AND is_active = TRUE
      `,
      [user.id]
    )
  ).rows;

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel rounded-[2.75rem] px-8 py-10 sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <span className="section-label text-teal-800">Account Settings</span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Manage {formatPersonName(user.full_name).split(' ')[0]}
                {"'"}s account.
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Update login details, switch plans, and jump into the parts of BudgetAI you manage most often.
              </p>
            </div>

            <Link href="/profile" className="secondary-button px-6 py-3 text-sm whitespace-nowrap">
              Back to Dashboard
            </Link>
          </div>
        </section>

        <AccountSettingsPanel
          fullName={formatPersonName(user.full_name)}
          email={user.email}
          subscriptionPlan={(user.subscription_plan as 'starter' | 'plus' | 'pro') || 'starter'}
          connectedInstitutionCount={Number(institution_count)}
          connectedAccountCount={Number(account_count)}
        />
      </div>
    </main>
  );
}
