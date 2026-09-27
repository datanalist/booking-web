const STEP_LABELS = [
  "Описание",
  "Фото",
  "Удобства",
  "Правила",
  "Дополнительное",
  "Стоимость",
] as const;

type ListingWizardStepperProps = {
  current: 1 | 2 | 3 | 4 | 5 | 6;
};

/** Горизонтальный степпер мастера: подчёркивание пройденных и текущего шага. */
export function ListingWizardStepper({ current }: ListingWizardStepperProps) {
  return (
    <div className="flex w-full items-start border-b border-[#ffe4b8] font-sans">
      {STEP_LABELS.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
        const reached = step <= current;
        return (
          <div
            key={label}
            className={[
              "flex min-w-0 flex-1 items-center justify-center p-[10px]",
              reached ? "border-b-2 border-[var(--color-ink)]" : "",
            ].join(" ")}
          >
            <span
              className={[
                "whitespace-nowrap text-[14px] font-normal leading-[1.4]",
                reached ? "text-[var(--color-ink)]" : "text-[#525353]",
              ].join(" ")}
            >
              {step}. {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
