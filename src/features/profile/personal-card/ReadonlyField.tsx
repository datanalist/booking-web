import { useId, type ReactElement } from "react";

export type ReadonlyFieldProps = {
  label: string;
  value: string;
};

export function ReadonlyField({
  label,
  value,
}: ReadonlyFieldProps): ReactElement {
  const id = useId();

  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[14px] font-normal leading-[1.4] text-[#525353]"
      >
        {label}
      </label>
      <input
        id={id}
        readOnly
        value={value}
        className="box-border h-11 w-full rounded-lg border border-[rgba(251,192,40,0.17)] bg-[rgba(251,192,40,0.06)] px-3.5 py-2.5 font-sans text-[16px] leading-[1.45] text-[var(--color-ink)] outline-none"
      />
    </div>
  );
}
