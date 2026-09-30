import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Extra classes for the dialog card (width, shadow). */
  className?: string;
};

export function Modal({
  open,
  title,
  children,
  onClose,
  className = "",
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-sans"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Закрыть"
          className="absolute right-3 top-3 border-0 bg-transparent text-[20px] cursor-pointer"
          onClick={onClose}
        >
          ×
        </button>
        <h2
          id="modal-title"
          className="m-0 pr-8 text-[18px] font-bold text-[var(--color-text)]"
        >
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
