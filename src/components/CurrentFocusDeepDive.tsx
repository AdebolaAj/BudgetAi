'use client';

import { useState } from 'react';
import ReportModal from '@/components/ReportModal';

type DeepDiveData = {
  summary: string;
  whyThisFocus: string;
  mainDrivers: string[];
  actionPlan: Array<{
    title: string;
    detail: string;
  }>;
  watchouts: string[];
};

type CurrentFocusDeepDiveProps = {
  currentFocus: string;
  focusMessage: string;
};

export default function CurrentFocusDeepDive({
  currentFocus,
  focusMessage,
}: CurrentFocusDeepDiveProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deepDive, setDeepDive] = useState<DeepDiveData | null>(null);

  const openDeepDive = async () => {
    setIsOpen(true);

    if (deepDive || isLoading) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/focus-deep-dive', {
        credentials: 'include',
      });

      const data = (await response.json()) as { error?: string; deepDive?: DeepDiveData };

      if (!response.ok || !data.deepDive) {
        setError(data.error ?? 'Failed to load the focus deep dive.');
        return;
      }

      setDeepDive(data.deepDive);
    } catch {
      setError('Failed to load the focus deep dive.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void openDeepDive();
        }}
        className="w-full rounded-[1.5rem] bg-slate-950 p-5 text-left text-white transition hover:bg-slate-900"
      >
        <p className="text-sm uppercase tracking-[0.22em] text-white/65">Current focus</p>
        <p className="mt-3 text-2xl font-semibold">{currentFocus}</p>
        <p className="mt-2 text-sm leading-6 text-white/70">{focusMessage}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          Click for deep dive
        </p>
      </button>

      <ReportModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="space-y-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              AI Deep Dive
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              {currentFocus}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Generated from your saved financial profile and current synced transaction data.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-[1.75rem] bg-white p-6 text-slate-600 shadow-sm">
              Building your deep dive...
            </div>
          ) : error ? (
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 text-red-700">
              {error}
            </div>
          ) : deepDive ? (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Summary
                  </p>
                  <p className="mt-3 text-base leading-7 text-slate-700">{deepDive.summary}</p>
                </div>
                <div className="rounded-[1.75rem] bg-teal-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                    Why this focus
                  </p>
                  <p className="mt-3 text-base leading-7 text-slate-700">{deepDive.whyThisFocus}</p>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Main drivers
                </p>
                <div className="mt-4 space-y-3">
                  {deepDive.mainDrivers.map((driver) => (
                    <div key={driver} className="rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                      {driver}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Action plan
                </p>
                <div className="mt-4 space-y-4">
                  {deepDive.actionPlan.map((action) => (
                    <div key={action.title} className="rounded-[1.25rem] border border-slate-200 px-4 py-4">
                      <p className="text-base font-semibold text-slate-950">{action.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{action.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-amber-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Watchouts
                </p>
                <div className="mt-4 space-y-3">
                  {deepDive.watchouts.map((watchout) => (
                    <div key={watchout} className="text-sm leading-6 text-slate-700">
                      {watchout}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </ReportModal>
    </>
  );
}
