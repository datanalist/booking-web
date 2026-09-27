import { useId } from "react";
import { formatClockTimeInput } from "../lib/formatClockTimeInput";

type TimeInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** Auth/wizard pale orange fill + soft border. */
  variant?: "default" | "auth";
};

export function TimeInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  variant = "auth",
}: TimeInputProps) {
  const id = useId();
  const isAuth = variant === "auth";
  const showErrorBorder = Boolean(error);

  const fieldClass = [
    "box-border w-full rounded-[8px] font-sans text-[16px] text-[var(--color-text)] outline-none",
    isAuth
      ? "h-[44px] bg-[rgba(251,192,40,0.06)] px-[14px] py-[10px] placeholder:text-[#525353]"
      : "border border-[#d0d0d0] px-3 py-2 focus:border-[var(--color-accent)]",
    isAuth && !showErrorBorder
      ? "border border-[rgba(251,192,40,0.17)]"
      : "",
    isAuth && showErrorBorder ? "border border-[#e34043]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const labelClass = isAuth
    ? "text-[14px] font-normal text-[#525353]"
    : "text-[14px] font-normal text-[var(--color-text)]";

  return (
    <div className="flex w-full min-w-0 flex-col gap-1 font-sans">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        className={fieldClass}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        maxLength={5}
        aria-invalid={showErrorBorder}
        onChange={(event) => onChange(formatClockTimeInput(event.target.value))}
      />
      {error ? (
        <span className="text-[14px] font-normal text-[#e34043]">{error}</span>
      ) : null}
    </div>
  );
}
