/** Единая причина изменения: степпер мастера объявления — единая прогресс-линия до текущего шага. */
import type { WizardStepNumber } from "./WizardStepNumber";
import {
  wizardProgressPercent,
  wizardStepProgress,
  type WizardStepProgress,
} from "./wizardStepProgress";

const STEP_LABELS: readonly string[] = [
  "Описание",
  "Фото",
  "Удобства",
  "Правила",
  "Дополнительное",
  "Стоимость",
];

type WizardStepsProps = {
  current: WizardStepNumber;
};

function labelClassName(progress: WizardStepProgress): string {
  switch (progress) {
    case "passed":
    case "current":
      return "text-[var(--color-ink)]";
    case "upcoming":
      return "text-[#525353]";
  }
}

/**
 * Подчёркивание — один абсолютно позиционированный блок шириной от начала до конца
 * текущего шага (шаги равной ширины без промежутков), поэтому линия непрерывна на любом шаге.
 */
export function WizardSteps({ current }: WizardStepsProps) {
  return (
    <nav
      aria-label="Шаги создания объявления"
      className="relative w-full border-b border-solid border-[#ffe4b8] font-sans"
    >
      <ol className="m-0 flex w-full list-none items-start p-0">
        {STEP_LABELS.map((label, index) => {
          const step = (index + 1) as WizardStepNumber;
          const progress = wizardStepProgress(step, current);
          return (
            <li
              key={label}
              aria-current={progress === "current" ? "step" : undefined}
              data-progress={progress}
              className={`flex min-w-0 flex-1 items-center justify-center p-[10px] text-[14px] leading-[1.4] ${labelClassName(progress)}`}
            >
              <span className="whitespace-nowrap">
                {step}. {label}
              </span>
            </li>
          );
        })}
      </ol>
      <div
        aria-hidden="true"
        data-testid="wizard-steps-progress"
        className="absolute bottom-0 left-0 h-0.5 bg-[var(--color-ink)]"
        style={{ width: `${wizardProgressPercent(current)}%` }}
      />
    </nav>
  );
}
