'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlaidLink } from 'react-plaid-link';
import type { PlaidAccount } from 'react-plaid-link';

interface PlaidConnectButtonProps {
  initialHasConnectedItem?: boolean;
  plaidItemId?: string;
  buttonLabel?: string;
  onConnected?: () => void;
}

export default function PlaidConnectButton({
  initialHasConnectedItem = false,
  plaidItemId,
  buttonLabel,
  onConnected,
}: PlaidConnectButtonProps) {
  const router = useRouter();
  const [hasConnectedItem, setHasConnectedItem] = useState(initialHasConnectedItem);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      setError('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicToken,
            institutionId: metadata.institution?.institution_id ?? '',
            institutionName: metadata.institution?.name ?? '',
            plaidItemId,
            accounts: metadata.accounts.map((account: PlaidAccount) => ({
              id: account.id,
              name: account.name,
              mask: account.mask ?? '',
              type: account.type,
              subtype: account.subtype ?? '',
            })),
          }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? 'Failed to connect Plaid.');
          return;
        }

        setLinkToken(null);
        setHasConnectedItem(true);
        onConnected?.();
        router.refresh();
      } catch {
        setError('Failed to connect Plaid.');
      } finally {
        setIsLoading(false);
        setShouldOpen(false);
      }
    },
    onExit: (plaidError) => {
      if (plaidError?.error_message) {
        setError(plaidError.error_message);
      }
      setShouldOpen(false);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (linkToken && shouldOpen && ready) {
      open();
    }
  }, [linkToken, open, ready, shouldOpen]);

  const handleConnect = async () => {
    setError('');
    setIsLoading(true);
    setShouldOpen(true);

    try {
      const response = await fetch('/api/plaid/link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          plaidItemId
            ? {
                plaidItemId,
              }
            : {}
        ),
      });

      const data = (await response.json()) as { linkToken?: string; error?: string };
      if (!response.ok || !data.linkToken) {
        setError(data.error ?? 'Failed to start Plaid Link.');
        setShouldOpen(false);
        return;
      }

      setLinkToken(data.linkToken);
    } catch {
      setError('Failed to start Plaid Link.');
      setShouldOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isLoading}
        className="primary-button px-6 py-3 text-sm whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? 'Opening Plaid...'
          : buttonLabel ?? (hasConnectedItem ? 'Connect Another Bank' : 'Connect Bank')}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
