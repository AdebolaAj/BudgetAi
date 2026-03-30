'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReportModal from '@/components/ReportModal';

const defaultDate = new Date().toISOString().slice(0, 10);

type TransactionEntryFormProps = {
  triggerClassName?: string;
};

export default function TransactionEntryForm({
  triggerClassName = 'section-label border-0 bg-white text-teal-800 shadow-sm whitespace-nowrap',
}: TransactionEntryFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          category,
          priority,
          notes,
          targetAmount,
          targetDate,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to save goal.');
        return;
      }

      setTitle('');
      setCategory('');
      setPriority('medium');
      setNotes('');
      setTargetAmount('');
      setTargetDate(defaultDate);
      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Failed to save goal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName}
      >
        Create New Goal
      </button>

      <ReportModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="mb-5">
          <h3 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Create new goal</h3>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">
              Goal Name
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-shell"
              placeholder="Emergency fund"
              required
            />
          </div>

          <div>
            <label htmlFor="targetAmount" className="mb-2 block text-sm font-medium text-slate-700">
              Target Amount
            </label>
            <input
              id="targetAmount"
              type="number"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="input-shell"
              placeholder="10000"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-700">
              Category
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-shell"
              placeholder="Food, Income, Utilities..."
            />
          </div>

          <div>
            <label htmlFor="priority" className="mb-2 block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="input-shell"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="targetDate" className="mb-2 block text-sm font-medium text-slate-700">
              Target Date
            </label>
            <input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-shell"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-shell min-h-20 resize-none"
              placeholder="Optional context for this entry"
            />
          </div>

          <div className="lg:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="primary-button px-8 py-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      </ReportModal>
    </>
  );
}
