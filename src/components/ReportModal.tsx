'use client';

import { createPortal } from 'react-dom';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ReportModal({ isOpen, onClose, children }: ReportModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-md" onClick={onClose} />

      <div className="relative flex min-h-full items-center justify-center px-3 py-2 sm:px-4 sm:py-4">
        <div className="glass-panel relative w-full max-w-5xl rounded-[2.25rem] overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-100/85 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-2xl text-slate-500 shadow-sm hover:bg-white hover:text-slate-700"
          >
            ✕
          </button>

          <div className="relative max-h-[calc(100vh-1rem)] overflow-y-auto px-6 pb-6 pt-20 sm:max-h-[calc(100vh-2rem)] sm:px-10 sm:pb-10 sm:pt-24">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
