'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type PlaidSyncButtonProps = {
  autoSyncOnMount?: boolean;
};

export default function PlaidSyncButton({ autoSyncOnMount = false }: PlaidSyncButtonProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const hasAutoSynced = useRef(false);

  const syncTransactions = async () => {
    setIsSyncing(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/plaid/sync-transactions', {
        method: 'POST',
      });

      const data = (await response.json()) as {
        error?: string;
        addedCount?: number;
        modifiedCount?: number;
        removedCount?: number;
      };

      if (!response.ok) {
        setError(data.error ?? 'Failed to sync Plaid transactions.');
        return;
      }

      setMessage(
        `Synced ${data.addedCount ?? 0} new, ${data.modifiedCount ?? 0} updated, ${data.removedCount ?? 0} removed.`
      );
      router.refresh();
    } catch {
      setError('Failed to sync Plaid transactions.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = () => {
    void syncTransactions();
  };

  useEffect(() => {
    if (!autoSyncOnMount || hasAutoSynced.current) {
      return;
    }

    hasAutoSynced.current = true;
    const runAutoSync = async () => {
      setIsSyncing(true);
      setMessage('');
      setError('');

      try {
        const response = await fetch('/api/plaid/sync-transactions', {
          method: 'POST',
        });

        const data = (await response.json()) as {
          error?: string;
          addedCount?: number;
          modifiedCount?: number;
          removedCount?: number;
        };

        if (!response.ok) {
          setError(data.error ?? 'Failed to sync Plaid transactions.');
          return;
        }

        setMessage(
          `Synced ${data.addedCount ?? 0} new, ${data.modifiedCount ?? 0} updated, ${data.removedCount ?? 0} removed.`
        );
        router.refresh();
      } catch {
        setError('Failed to sync Plaid transactions.');
      } finally {
        setIsSyncing(false);
      }
    };

    void runAutoSync();
  }, [autoSyncOnMount, router]);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="secondary-button px-5 py-3 text-sm whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSyncing ? 'Syncing...' : 'Refresh Bank Transactions'}
      </button>
      {message ? <p className="text-sm text-teal-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
