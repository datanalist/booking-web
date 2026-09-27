import { useId } from "react";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

/** Toggle with label on one baseline; layout owned by the caller’s row. */
export function Switch({ checked, onChange, label }: SwitchProps) {
  const id = useId();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <label
        htmlFor={id}
        className="m-0 min-w-0 flex-1 cursor-pointer text-left text-[14px] font-bold leading-[1.4] text-[var(--color-ink)]"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative h-6 w-[44px] shrink-0 cursor-pointer rounded-full border-0 p-0 transition-colors ${
          checked ? "bg-[var(--color-accent)]" : "bg-[#525353]"
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute top-0 size-6 rounded-full border-2 bg-white transition-[left] duration-150 ${
            checked
              ? "left-5 border-[var(--color-accent)]"
              : "left-0 border-[#525353]"
          }`}
        />
      </button>
    </div>
  );
}
