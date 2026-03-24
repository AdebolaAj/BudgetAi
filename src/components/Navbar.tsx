'use client';

interface NavbarProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export default function Navbar({ onSignInClick, onSignUpClick }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 px-4 pt-4">
      <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-full px-5 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-900 text-lg text-amber-300 shadow-lg shadow-teal-900/20">
            $
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-800/70">
              Smart Finance
            </p>
            <h1 className="text-xl font-bold text-slate-900">BudgetAI</h1>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#why-budget-ai" className="text-sm font-semibold text-slate-700 hover:text-teal-700">
            Why BudgetAI
          </a>
          <a href="#testimonials" className="text-sm font-semibold text-slate-700 hover:text-teal-700">
            Testimonials
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSignInClick}
            className="secondary-button px-5 py-2.5 text-sm"
          >
            Sign In
          </button>
          <button
            onClick={onSignUpClick}
            className="primary-button px-5 py-2.5 text-sm"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}
