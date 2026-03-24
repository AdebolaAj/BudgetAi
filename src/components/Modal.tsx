'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
}

export default function Modal({ isOpen, onClose, children, panelClassName = 'max-w-md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative flex min-h-full items-center justify-center px-3 py-2 sm:px-4 sm:py-3">
        <div
          className={`glass-panel relative w-full max-h-[calc(100vh-1rem)] overflow-y-auto rounded-[2rem] sm:max-h-[calc(100vh-1.5rem)] ${panelClassName}`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-teal-100/80 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-xl text-slate-500 hover:bg-white hover:text-slate-700"
          >
            ✕
          </button>

          <div className="relative p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
