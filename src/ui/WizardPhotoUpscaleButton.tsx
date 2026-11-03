/** Единая причина изменения: кнопка улучшения на заполненном фото, без второго запроса. */
import { useRef, useState } from "react";

type WizardPhotoUpscaleButtonProps = {
  className?: string;
  onUpscale: () => Promise<void> | void;
};

export function WizardPhotoUpscaleButton({
  className = "",
  onUpscale,
}: WizardPhotoUpscaleButtonProps) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);

  async function press(): Promise<void> {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await onUpscale();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-label="Улучшить фото"
      aria-busy={busy}
      disabled={busy}
      className={`absolute top-0 left-0 z-10 flex size-6 cursor-pointer items-center justify-center rounded-full border-0 bg-[#2a2a2e] p-0 text-white disabled:cursor-wait disabled:opacity-70 ${className}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void press();
      }}
      onDragStart={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {busy ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          className="block size-[18px]"
        >
          <path
            d="M15 9 21 3M21 8V3h-5M9 9 3 3M3 8V3h5M15 15l6 6M21 16v5h-5M9 15l-6 6M3 16v5h5"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
