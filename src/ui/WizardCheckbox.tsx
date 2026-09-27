type WizardCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function WizardCheckbox({
  label,
  checked,
  onChange,
}: WizardCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 font-sans">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <img
        src={
          checked
            ? "/icon-check-square-checked.svg"
            : "/icon-check-square.svg"
        }
        alt=""
        width={20}
        height={20}
        className="pointer-events-none shrink-0"
      />
      <span className="text-[16px] leading-[1.45] text-[var(--color-ink)]">
        {label}
      </span>
    </label>
  );
}
