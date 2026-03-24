'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { emptyFinancialProfile, type FinancialProfile } from '@/lib/financialProfile';

const stepDetails = [
  {
    id: 1,
    eyebrow: 'Step 1',
    title: 'Identity and location',
    description: 'Start with the basics so your budget feels localized and personalized.',
  },
  {
    id: 2,
    eyebrow: 'Step 2',
    title: 'Income and obligations',
    description: 'Capture the recurring costs that shape your monthly decisions.',
  },
  {
    id: 3,
    eyebrow: 'Step 3',
    title: 'Spending and savings',
    description: 'Add flexible categories and define what progress looks like for you.',
  },
];

const incomeFrequencyDetails = {
  hourly: {
    label: 'Hourly Income',
    placeholder: '35',
    hint: 'Enter your typical hourly rate before taxes.',
  },
  monthly: {
    label: 'Monthly Income',
    placeholder: '5000',
    hint: 'Enter your average monthly income before taxes.',
  },
  yearly: {
    label: 'Yearly Income',
    placeholder: '65000',
    hint: 'Enter your annual income before taxes.',
  },
} as const;

export default function OnboardingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<FinancialProfile>(emptyFinancialProfile);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/financial-profile', {
          credentials: 'include',
        });

        if (response.status === 401) {
          router.push('/');
          return;
        }

        const data = (await response.json()) as {
          error?: string;
          profile?: FinancialProfile;
        };

        if (!response.ok || !data.profile) {
          setErrorMessage(data.error ?? 'Failed to load your saved financial profile.');
          return;
        }

        setFormData((prev) => ({
          ...prev,
          ...data.profile,
        }));
      } catch (error) {
        console.error('Failed to load saved financial profile:', error);
        setErrorMessage('Failed to load your saved financial profile.');
      } finally {
        setIsBootstrapping(false);
      }
    };

    void loadProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/financial-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setErrorMessage(data.error ?? 'Failed to save your financial profile.');
        return;
      }

      router.refresh();
      router.push('/profile');
    } catch (error) {
      console.error('Onboarding error:', error);
      setErrorMessage('Failed to save your financial profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStep = stepDetails[step - 1];
  const incomeDetails =
    incomeFrequencyDetails[formData.frequency as keyof typeof incomeFrequencyDetails];

  return (
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="glass-panel rounded-[2.5rem] p-8 sm:p-10">
          <span className="section-label text-teal-800">Guided Setup</span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
            Build your financial profile.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-700">
            BudgetAI uses this information to shape recommendations, highlight pressure points, and
            make your dashboard feel relevant from the first session.
          </p>

          <div className="mt-10 space-y-4">
            {stepDetails.map((item) => {
              const active = item.id === step;
              const complete = item.id < step;

              return (
                <div
                  key={item.id}
                  className={`rounded-[1.75rem] border p-5 ${
                    active
                      ? 'border-teal-200 bg-white shadow-lg shadow-teal-900/8'
                      : 'border-slate-900/8 bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {item.eyebrow}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        complete
                          ? 'bg-teal-100 text-teal-700'
                          : active
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {complete ? 'Done' : active ? 'Current' : 'Pending'}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="surface-card rounded-[2.5rem] p-8 sm:p-10">
          <div className="mb-8 flex flex-col gap-4 border-b border-slate-900/8 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
                {currentStep.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">{currentStep.title}</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                {currentStep.description}
              </p>
            </div>
            <div className="min-w-44">
              <div className="mb-2 flex justify-between text-sm font-medium text-slate-600">
                <span>Progress</span>
                <span>{Math.round((step / 3) * 100)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {isBootstrapping ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-10 text-center text-slate-600">
              Loading your saved financial profile...
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              {step === 1 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="input-shell"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="userLocation"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      User Location
                    </label>
                    <input
                      type="text"
                      id="userLocation"
                      name="userLocation"
                      value={formData.userLocation}
                      onChange={handleChange}
                      required
                      className="input-shell"
                      placeholder="New York, NY"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="workLocation"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Work Location
                    </label>
                    <input
                      type="text"
                      id="workLocation"
                      name="workLocation"
                      value={formData.workLocation}
                      onChange={handleChange}
                      required
                      className="input-shell"
                      placeholder="Brooklyn, NY or Remote"
                    />
                  </div>

                  <div>
                    <label htmlFor="currency" className="mb-2 block text-sm font-medium text-slate-700">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="input-shell"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="frequency" className="mb-2 block text-sm font-medium text-slate-700">
                      Income Type
                    </label>
                    <select
                      id="frequency"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      className="input-shell"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="salary" className="mb-2 block text-sm font-medium text-slate-700">
                      {incomeDetails.label}
                    </label>
                    <input
                      type="number"
                      id="salary"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      required
                      className="input-shell"
                      placeholder={incomeDetails.placeholder}
                    />
                    <p className="mt-2 text-sm leading-6 text-slate-500">{incomeDetails.hint}</p>
                  </div>

                  <div>
                    <label htmlFor="monthlyRent" className="mb-2 block text-sm font-medium text-slate-700">
                      Monthly Rent / Mortgage
                    </label>
                    <input
                      type="number"
                      id="monthlyRent"
                      name="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={handleChange}
                      className="input-shell"
                      placeholder="1500"
                    />
                  </div>

                  <div>
                    <label htmlFor="monthlyBills" className="mb-2 block text-sm font-medium text-slate-700">
                      Bills
                    </label>
                    <input
                      type="number"
                      id="monthlyBills"
                      name="monthlyBills"
                      value={formData.monthlyBills}
                      onChange={handleChange}
                      className="input-shell"
                      placeholder="300"
                    />
                  </div>

                  <div>
                    <label htmlFor="monthlyUtilities" className="mb-2 block text-sm font-medium text-slate-700">
                      Utilities
                    </label>
                    <input
                      type="number"
                      id="monthlyUtilities"
                      name="monthlyUtilities"
                      value={formData.monthlyUtilities}
                      onChange={handleChange}
                      className="input-shell"
                      placeholder="150"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="monthlyInsurance" className="mb-2 block text-sm font-medium text-slate-700">
                      Pre-tax Insurance Premiums
                    </label>
                    <input
                      type="number"
                      id="monthlyInsurance"
                      name="monthlyInsurance"
                      value={formData.monthlyInsurance}
                      onChange={handleChange}
                      className="input-shell"
                      placeholder="200"
                    />
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      This will be treated as a pre-tax payroll deduction before estimating take-home pay.
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="monthlyFoodBudget"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Food Budget
                  </label>
                  <input
                    type="number"
                    id="monthlyFoodBudget"
                    name="monthlyFoodBudget"
                    value={formData.monthlyFoodBudget}
                    onChange={handleChange}
                    className="input-shell"
                    placeholder="400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="monthlyTransport"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Transportation
                  </label>
                  <input
                    type="number"
                    id="monthlyTransport"
                    name="monthlyTransport"
                    value={formData.monthlyTransport}
                    onChange={handleChange}
                    className="input-shell"
                    placeholder="200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="monthlyEntertainment"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Entertainment & Dining
                  </label>
                  <input
                    type="number"
                    id="monthlyEntertainment"
                    name="monthlyEntertainment"
                    value={formData.monthlyEntertainment}
                    onChange={handleChange}
                    className="input-shell"
                    placeholder="300"
                  />
                </div>

                <div>
                  <label htmlFor="monthlyPlans" className="mb-2 block text-sm font-medium text-slate-700">
                    Subscriptions
                  </label>
                  <input
                    type="number"
                    id="monthlyPlans"
                    name="monthlyPlans"
                    value={formData.monthlyPlans}
                    onChange={handleChange}
                    className="input-shell"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="monthlyDonations"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Donations
                  </label>
                  <input
                    type="number"
                    id="monthlyDonations"
                    name="monthlyDonations"
                    value={formData.monthlyDonations}
                    onChange={handleChange}
                    className="input-shell"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="currentSavings"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Current Savings
                  </label>
                  <input
                    type="number"
                    id="currentSavings"
                    name="currentSavings"
                    value={formData.currentSavings}
                    onChange={handleChange}
                    className="input-shell"
                    placeholder="10000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="savingsGoal" className="mb-2 block text-sm font-medium text-slate-700">
                    Annual Savings Goal
                  </label>
                  <input
                    type="number"
                    id="savingsGoal"
                    name="savingsGoal"
                    value={formData.savingsGoal}
                    onChange={handleChange}
                    className="input-shell"
                    placeholder="5000"
                  />
                </div>
                </div>
              )}

              <div className="mt-10 flex flex-col gap-4 border-t border-slate-900/8 pt-8 sm:flex-row">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="secondary-button px-6 py-3.5"
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="primary-button px-6 py-3.5 sm:ml-auto"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void handleSubmit();
                    }}
                    disabled={isLoading}
                    className="primary-button px-6 py-3.5 sm:ml-auto disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? 'Setting up...' : 'Complete Setup'}
                  </button>
                )}
              </div>
            </form>
          )}

          <p className="mt-6 text-sm leading-6 text-slate-500">
            You can revise these numbers later as your income, goals, or obligations change.
          </p>
        </section>
      </div>
    </div>
  );
}
