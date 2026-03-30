'use client';

import { useState } from 'react';
import Description from '@/components/Description';
import Modal from '@/components/Modal';
import Navbar from '@/components/Navbar';
import SignIn from '@/components/SignIn';
import SignUp from '@/components/SignUp';
import Testimonials from '@/components/Testimonials';

const metrics = [
  { label: 'Setup time', value: '7 min' },
  { label: 'Accounts supported', value: 'Multi-bank' },
  { label: 'Planning mode', value: 'Live + manual' },
];

export default function Home() {
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  const handleSwitchToSignUp = () => {
    setSignInOpen(false);
    setSignUpOpen(true);
  };

  const handleSwitchToSignIn = () => {
    setSignUpOpen(false);
    setSignInOpen(true);
  };

  return (
    <main>
      <Navbar
        onSignInClick={() => setSignInOpen(true)}
        onSignUpClick={() => setSignUpOpen(true)}
      />

      <section className="px-4 pb-16 pt-8 sm:pt-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel overflow-hidden rounded-[2.5rem] px-6 py-10 sm:px-10 sm:py-12">
            <span className="section-label text-teal-800">AI-Powered Budgeting</span>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              See where your money goes, then plan what happens next.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              BudgetAI connects your accounts, tracks real spending, and turns your financial profile
              into a clearer monthly plan.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => setSignUpOpen(true)}
                className="primary-button px-7 py-4 text-base"
              >
                Create Free Account
              </button>
              <button
                onClick={() => setSignInOpen(true)}
                className="secondary-button px-7 py-4 text-base"
              >
                View Your Dashboard
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.75rem] bg-white/70 p-5 shadow-sm">
                  <p className="text-3xl font-semibold text-slate-950">{metric.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="surface-card rounded-[2.5rem] p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">
                    Monthly Snapshot
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">One clear monthly view</h2>
                </div>
                <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
                  Stable
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">Available to save</p>
                  <p className="mt-3 text-4xl font-semibold">$1,240</p>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-2/3 rounded-full bg-teal-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[1.5rem] bg-teal-50 p-5">
                    <p className="text-sm font-semibold text-slate-600">Income</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">$5,800</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-slate-600">Expenses</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">$4,560</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-card rounded-[2.5rem] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">What You Get</p>
              <ul className="mt-5 space-y-4 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                    01
                  </span>
                  One onboarding flow for salary, goals, caps, and account connections.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                    02
                  </span>
                  Live transaction tracking that shows spending, rent, utilities, and savings in context.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                    03
                  </span>
                  Focused planning tools for goals, reports, and deeper AI guidance when you need it.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Description />
      <Testimonials />

      <footer className="px-4 pb-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-[2rem] border border-slate-900/8 bg-slate-950 px-8 py-8 text-slate-300 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300">
              BudgetAI
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              A budgeting app focused on calm planning, sharper tradeoffs, and better financial
              habits.
            </p>
          </div>
          <p className="text-sm text-slate-500">&copy; 2026 BudgetAI. All rights reserved.</p>
        </div>
      </footer>

      <Modal isOpen={signInOpen} onClose={() => setSignInOpen(false)}>
        <SignIn onSwitchToSignUp={handleSwitchToSignUp} />
      </Modal>

      <Modal isOpen={signUpOpen} onClose={() => setSignUpOpen(false)}>
        <SignUp onSwitchToSignIn={handleSwitchToSignIn} />
      </Modal>
    </main>
  );
}
