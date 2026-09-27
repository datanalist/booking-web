import { useId, useState } from "react";

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  /** Auth screens: pale orange fill + soft border. Default keeps gray for cabinet/onboarding. */
  variant?: "default" | "auth";
  /** When true, render eye toggle; effective type toggles text/password. */
  passwordToggle?: boolean;
  /** Force error border (#e34043) even if error text is rendered outside (login). */
  invalid?: boolean;
};

export function Input({
  label,
  value,
  onChange,
  type = "text",
  hint,
  error,
  placeholder,
  maxLength,
  multiline = false,
  variant = "default",
  passwordToggle = false,
  invalid = false,
}: InputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isAuth = variant === "auth";
  const showErrorBorder = Boolean(error) || invalid;
  const effectiveType = passwordToggle
    ? visible
      ? "text"
      : "password"
    : type;

  const fieldClass = [
    "box-border w-full rounded-[8px] font-sans text-[16px] text-[var(--color-ink)] outline-none",
    isAuth
      ? `${multiline ? "min-h-[120px] resize-none" : "h-[44px]"} bg-[rgba(251,192,40,0.06)] px-[14px] py-[10px] placeholder:text-[#525353]`
      : "border border-[#d0d0d0] px-3 py-2 text-[var(--color-text)] focus:border-[var(--color-accent)]",
    isAuth && !showErrorBorder
      ? "border border-[rgba(251,192,40,0.17)]"
      : "",
    isAuth && showErrorBorder ? "border border-[#e34043]" : "",
    passwordToggle ? "pr-11" : "",
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
      {multiline ? (
        <textarea
          id={id}
          className={fieldClass}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
        />
      ) : (
        <div className="relative box-border w-full min-w-0">
          <input
            id={id}
            className={fieldClass}
            type={effectiveType}
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            onChange={(event) => onChange(event.target.value)}
          />
          {passwordToggle ? (
            <button
              type="button"
              className="absolute right-[14px] top-1/2 size-5 -translate-y-1/2 border-0 bg-transparent p-0"
              aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
              onClick={() => setVisible((current) => !current)}
            >
              <img
                src={visible ? "/icon-eye-show.svg" : "/icon-eye-hide.svg"}
                alt=""
                width={20}
                height={20}
              />
            </button>
          ) : null}
        </div>
      )}
      {error ? (
        <span className="text-[14px] font-normal text-[#e34043]">{error}</span>
      ) : hint ? (
        <span className="text-[14px] font-normal text-[#757575]">{hint}</span>
      ) : null}
    </div>
  );
}
