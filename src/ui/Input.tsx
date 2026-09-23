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
}: InputProps) {
  const fieldClass =
    "w-full rounded-[8px] border border-[#d0d0d0] px-3 py-2 font-sans text-[16px] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

  return (
    <label className="flex flex-col gap-1 font-sans">
      <span className="text-[14px] font-normal text-[var(--color-text)]">
        {label}
      </span>
      {multiline ? (
        <textarea
          className={fieldClass}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
        />
      ) : (
        <input
          className={fieldClass}
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? (
        <span className="text-[14px] font-normal text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-[14px] font-normal text-[#757575]">{hint}</span>
      ) : null}
    </label>
  );
}
