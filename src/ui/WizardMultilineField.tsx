import { useId } from "react";

type WizardMultilineFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  error?: string;
  onChange: (value: string) => void;
};

/** Многострочное поле мастера объявления (заливка и счётчик как в Figma). */
export function WizardMultilineField({
  label,
  value,
  placeholder,
  maxLength,
  error,
  onChange,
}: WizardMultilineFieldProps) {
  const id = useId();
  const count = value.length;

  return (
    <div className="flex w-full flex-col gap-1 font-sans">
      <div className="flex h-[160px] w-full flex-col gap-1 overflow-hidden rounded-[8px]">
        <label htmlFor={id} className="text-[14px] font-normal leading-[1.4] text-[#525353]">
          {label}
        </label>
        <textarea
          id={id}
          className={[
            "box-border min-h-0 w-full flex-1 resize-none rounded-[8px] px-[14px] py-[10px]",
            "bg-[rgba(251,192,40,0.06)] font-sans text-[16px] leading-[1.45] text-[var(--color-ink)]",
            "placeholder:text-[#525353] outline-none",
            error
              ? "border border-[#e34043]"
              : "border border-[rgba(251,192,40,0.17)]",
          ].join(" ")}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? (
        <span className="self-end text-[12px] font-normal leading-[1.5] text-[#e34043]">
          {error}
        </span>
      ) : (
        <span className="self-end text-[12px] font-normal leading-[1.5] text-[#525353]">
          {count}/{maxLength}
        </span>
      )}
    </div>
  );
}
