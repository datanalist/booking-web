import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  CONFIRMED_STATUS_SORT_LABELS,
  CONFIRMED_STATUS_SORT_OPTIONS,
  type ConfirmedStatusSortOption,
} from "./confirmedStatusSortOption";

type ConfirmedStatusSortControlProps = {
  value: ConfirmedStatusSortOption;
  onChange: (value: ConfirmedStatusSortOption) => void;
};

export function ConfirmedStatusSortControl({
  value,
  onChange,
}: ConfirmedStatusSortControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative flex items-center gap-3" ref={rootRef}>
      <span className="text-sm leading-5 text-[var(--color-ink)]">
        Сортировать по статусу
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--color-ink)] bg-transparent px-4 py-1 text-sm leading-5 text-[var(--color-ink)]"
        onClick={() => setOpen((current) => !current)}
      >
        {CONFIRMED_STATUS_SORT_LABELS[value]}
        <ChevronDown aria-hidden className="size-5" strokeWidth={1.75} />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="listbox"
          aria-label="Сортировать по статусу"
          className="absolute right-0 top-[calc(100%+8px)] z-20 m-0 w-60 list-none rounded-2xl bg-white p-2 shadow-[0_8px_24px_rgba(26,27,29,0.12)]"
        >
          {CONFIRMED_STATUS_SORT_OPTIONS.map((option) => {
            const selected = option === value;
            return (
              <li key={option} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-sm leading-5 ${
                    selected
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-ink)]"
                  }`}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <span>{CONFIRMED_STATUS_SORT_LABELS[option]}</span>
                  {selected ? (
                    <Check
                      aria-hidden
                      className="size-4 text-[var(--color-accent)]"
                      strokeWidth={2}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
