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
    <ol className="m-0 flex list-none gap-2 p-0 font-sans">
      {STEP_LABELS.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
        const active = step === current;
        const done = step < current;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-[14px] ${
              active
                ? "bg-[var(--color-accent)] text-white"
                : done
                  ? "text-[var(--color-accent)]"
                  : "text-[#9e9e9e]"
            }`}
          >
            <span className="font-bold">{step}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
