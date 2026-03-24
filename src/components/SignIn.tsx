'use client';

import { KeyboardEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SignInProps {
  onSwitchToSignUp?: () => void;
}

export default function SignIn({ onSwitchToSignUp }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEnterSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || isLoading) return;
    e.currentTarget.form?.requestSubmit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to sign in.');
        return;
      }

      router.push('/profile');
    } catch (error) {
      setError('Failed to sign in.');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="section-label text-teal-800">Welcome Back</p>
      <h2 className="mb-2 mt-5 text-3xl font-semibold text-slate-950">Sign in to your account</h2>
      <p className="mb-6 text-sm leading-6 text-slate-600">
        Pick up where you left off and continue refining your budget.
      </p>
      
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleEnterSubmit}
            required
            className="input-shell"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleEnterSubmit}
            required
            className="input-shell"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="primary-button w-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {onSwitchToSignUp && (
        <p className="mt-5 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Sign up
          </button>
        </p>
      )}
    </div>
  );
}
