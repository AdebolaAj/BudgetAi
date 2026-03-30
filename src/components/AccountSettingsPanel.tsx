'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type AccountSettingsPanelProps = {
  fullName: string;
  email: string;
  subscriptionPlan: 'starter' | 'plus' | 'pro';
  connectedInstitutionCount: number;
  connectedAccountCount: number;
};

type SettingsSection = 'account' | 'security' | 'billing' | 'workspace';

const sectionLabels: Record<SettingsSection, string> = {
  account: 'Account',
  security: 'Security',
  billing: 'Billing',
  workspace: 'Workspace',
};

export default function AccountSettingsPanel({
  fullName,
  email,
  subscriptionPlan,
  connectedInstitutionCount,
  connectedAccountCount,
}: AccountSettingsPanelProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [emailValue, setEmailValue] = useState(email);
  const [emailPassword, setEmailPassword] = useState('');
  const [subscriptionValue, setSubscriptionValue] = useState(subscriptionPlan);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const saveEmail = async () => {
    resetMessages();
    setIsSaving(true);

    try {
      const response = await fetch('/api/account/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          email: emailValue,
          currentPassword: emailPassword,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to update email.');
        return;
      }

      setSuccess('Email updated.');
      setEmailPassword('');
      router.refresh();
    } catch {
      setError('Failed to update email.');
    } finally {
      setIsSaving(false);
    }
  };

  const savePassword = async () => {
    resetMessages();

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation must match.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/account/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          currentPassword,
          newPassword,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to update password.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated.');
    } catch {
      setError('Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSubscription = async () => {
    resetMessages();
    setIsSaving(true);

    try {
      const response = await fetch('/api/account/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subscription',
          subscriptionPlan: subscriptionValue,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to update subscription plan.');
        return;
      }

      setSuccess('Subscription plan updated.');
      router.refresh();
    } catch {
      setError('Failed to update subscription plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.3fr_0.7fr]">
      <aside className="surface-card rounded-[2rem] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Settings menu
        </p>
        <div className="mt-5 space-y-2">
          {(Object.keys(sectionLabels) as SettingsSection[]).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => {
                resetMessages();
                setActiveSection(section);
              }}
              className={`w-full rounded-[1.25rem] px-4 py-3 text-left text-sm font-semibold transition ${
                activeSection === section
                  ? 'bg-teal-950 text-white shadow-lg shadow-teal-950/15'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {sectionLabels[section]}
            </button>
          ))}
        </div>
      </aside>

      <section className="surface-card rounded-[2rem] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          {sectionLabels[activeSection]}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">
          {activeSection === 'account' && 'Update your account details'}
          {activeSection === 'security' && 'Keep your login secure'}
          {activeSection === 'billing' && 'Choose your BudgetAI plan'}
          {activeSection === 'workspace' && 'Jump to the parts you manage most'}
        </h2>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {activeSection === 'account' ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2 rounded-[1.5rem] bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">{fullName}</p>
              <p className="mt-1 text-sm text-slate-600">
                Your name is managed from the financial profile flow so it stays aligned with the
                rest of your dashboard.
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="emailValue" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="emailValue"
                type="email"
                value={emailValue}
                onChange={(event) => setEmailValue(event.target.value)}
                className="input-shell"
                placeholder="you@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="emailPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Current password
              </label>
              <input
                id="emailPassword"
                type="password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                className="input-shell"
                placeholder="Confirm with your current password"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  void saveEmail();
                }}
                disabled={isSaving}
                className="primary-button px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Update Email'}
              </button>
            </div>
          </div>
        ) : null}

        {activeSection === 'security' ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Current password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="input-shell"
                placeholder="Current password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="input-shell"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input-shell"
                placeholder="Repeat new password"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  void savePassword();
                }}
                disabled={isSaving}
                className="primary-button px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </div>
        ) : null}

        {activeSection === 'billing' ? (
          <div className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {[
                {
                  id: 'starter',
                  title: 'Starter',
                  price: 'Free',
                  detail: 'Track linked accounts, goals, and your initial report.',
                },
                {
                  id: 'plus',
                  title: 'Plus',
                  price: '$12/mo',
                  detail: 'Priority insights, richer coaching, and deeper planning workflows.',
                },
                {
                  id: 'pro',
                  title: 'Pro',
                  price: '$29/mo',
                  detail: 'Everything in Plus, with more advanced monitoring and team-ready controls.',
                },
              ].map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSubscriptionValue(plan.id as 'starter' | 'plus' | 'pro')}
                  className={`rounded-[1.75rem] border px-5 py-5 text-left transition ${
                    subscriptionValue === plan.id
                      ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-950/8'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {plan.title}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{plan.price}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{plan.detail}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  void saveSubscription();
                }}
                disabled={isSaving}
                className="primary-button px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        ) : null}

        {activeSection === 'workspace' ? (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-[1.75rem] bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Connected institutions
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{connectedInstitutionCount}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {connectedAccountCount} linked account{connectedAccountCount === 1 ? '' : 's'} are
                currently shared with BudgetAI.
              </p>
              <Link href="/accounts" className="secondary-button mt-5 inline-flex px-5 py-3 text-sm">
                Open Bank Reports
              </Link>
            </div>

            <div className="rounded-[1.75rem] bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Profile and planning
              </p>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Update your financial profile inputs, salary baseline, location details, and monthly caps.
              </p>
              <Link href="/setup" className="secondary-button mt-5 inline-flex px-5 py-3 text-sm">
                Update Financial Profile
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
