import type { WizardStepNumber } from "./WizardStepNumber";

/** Положение шага относительно текущего: пройден, текущий или впереди. */
export type WizardStepProgress = "passed" | "current" | "upcoming";

export const WIZARD_STEP_COUNT = 6;

export function wizardStepProgress(
  step: WizardStepNumber,
  current: WizardStepNumber,
): WizardStepProgress {
  if (step < current) {
    return "passed";
  }
  return step === current ? "current" : "upcoming";
}

/** Доля ширины степпера (в %) от первого шага до текущего включительно. */
export function wizardProgressPercent(current: WizardStepNumber): number {
  return (current / WIZARD_STEP_COUNT) * 100;
}
