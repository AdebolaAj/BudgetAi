'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReportModal from '@/components/ReportModal';

const defaultDate = new Date().toISOString().slice(0, 10);

export default function TransactionEntryForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [entryType, setEntryType] = useState<'credit' | 'debit'>('debit');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [occurredOn, setOccurredOn] = useState(defaultDate);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryType,
          title,
          category,
          notes,
          amount,
          occurredOn,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to save entry.');
        return;
      }

      setTitle('');
      setCategory('');
      setNotes('');
      setAmount('');
      setOccurredOn(defaultDate);
      setEntryType('debit');
      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Failed to save entry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="section-label border-0 bg-white text-teal-800 shadow-sm whitespace-nowrap"
      >
        Create New Report
      </button>

      <ReportModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="mb-5">
          <h3 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Create new report</h3>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="entryType" className="mb-2 block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="entryType"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as 'credit' | 'debit')}
              className="input-shell"
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="mb-2 block text-sm font-medium text-slate-700">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-shell"
              placeholder="125.00"
              required
            />
          </div>

          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-shell"
              placeholder="Groceries"
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
              required
            />
          </div>

          <div>
            <label htmlFor="occurredOn" className="mb-2 block text-sm font-medium text-slate-700">
              Date
            </label>
            <input
              id="occurredOn"
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="input-shell"
              required
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
              {isSaving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </ReportModal>
    </>
  );
}
