'use client';

import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', {
      method: 'POST',
    });

    router.push('/');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleSignOut();
      }}
      className="mt-8 w-full rounded-full bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800"
    >
      Sign Out
    </button>
  );
}
