/** Единая причина изменения: табы шагов мастера создания объявления по макету. */

const STEP_LABELS = [
  "Описание",
  "Фото",
  "Удобства",
  "Правила",
  "Дополнительное",
  "Стоимость",
] as const;

type WizardStepsProps = {
  current: 1 | 2 | 3 | 4 | 5 | 6;
};

export function WizardSteps({ current }: WizardStepsProps) {
  return (
    <ol className="m-0 flex w-full list-none items-start border-b border-[#ffe4b8] p-0 font-sans">
      {STEP_LABELS.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
        const active = step === current;
        return (
          <li
            key={label}
            className={`flex min-w-0 flex-1 items-center justify-center p-[10px] text-[14px] leading-[1.4] ${
              active
                ? "border-b-2 border-[var(--color-ink)] text-[var(--color-ink)]"
                : "border-b-2 border-transparent text-[#525353]"
            }`}
          >
            <span className="whitespace-nowrap">
              {step}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
