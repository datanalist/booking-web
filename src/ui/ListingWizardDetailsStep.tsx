import { DESCRIPTION_MAX } from "../config";
import { ListingWizardStepper } from "./ListingWizardStepper";
import { WizardBackButton } from "./WizardBackButton";
import { WizardMultilineField } from "./WizardMultilineField";

export type ListingWizardDetailsValues = {
  accessInfo: string;
  houseRules: string;
  extraInfo: string;
};

type ListingWizardDetailsStepProps = {
  values: ListingWizardDetailsValues;
  errors: Record<string, string>;
  pending: boolean;
  onChange: (partial: Partial<ListingWizardDetailsValues>) => void;
  /** Стрелка в шапке: выход в список объявлений. */
  onExit: () => void;
  /** Кнопка «Вернуться»: предыдущий шаг мастера. */
  onBack: () => void;
  onNext: () => void;
};

/** Шаг 5 мастера: дополнительные сведения (макет Figma 1:19894). */
export function ListingWizardDetailsStep({
  values,
  errors,
  pending,
  onChange,
  onExit,
  onBack,
  onNext,
}: ListingWizardDetailsStepProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-8 overflow-auto bg-[rgba(251,192,40,0.06)] px-8 py-8 font-sans">
      <header className="flex w-full items-center gap-5">
        <WizardBackButton disabled={pending} onClick={onExit} />
        <h1 className="text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Создание объявления
        </h1>
      </header>

      <ListingWizardStepper current={5} />

      <section className="flex w-full grow shrink-0 flex-col items-center rounded-[16px] border border-[rgba(251,192,40,0.17)] bg-white">
        <div className="flex w-full max-w-[437px] shrink-0 flex-col gap-8 py-10">
          <h2 className="w-full text-[18px] font-bold tracking-[0.018px] text-[var(--color-ink)]">
            Укажите дополнительные сведения
          </h2>

          <div className="flex w-full flex-col gap-6">
            <WizardMultilineField
              label="Инструкция, как попасть внутрь"
              placeholder="Опишите, как попасть в жилье"
              value={values.accessInfo}
              maxLength={DESCRIPTION_MAX}
              error={errors.accessInfo}
              onChange={(accessInfo) => onChange({ accessInfo })}
            />
            <WizardMultilineField
              label="Правила проживания"
              placeholder="Укажите правила проживания"
              value={values.houseRules}
              maxLength={DESCRIPTION_MAX}
              error={errors.houseRules}
              onChange={(houseRules) => onChange({ houseRules })}
            />
            <WizardMultilineField
              label="Дополнительная информация"
              placeholder="Укажите дополнительную информацию"
              value={values.extraInfo}
              maxLength={DESCRIPTION_MAX}
              error={errors.extraInfo}
              onChange={(extraInfo) => onChange({ extraInfo })}
            />
          </div>

          <div className="flex w-full shrink-0 items-start gap-5">
            <button
              type="button"
              disabled={pending}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-lg bg-transparent px-6 py-5 font-sans text-[18px] font-bold tracking-[0.018px] text-orange-400 outline outline-1 outline-offset-[-1px] outline-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onBack}
            >
              Вернуться
            </button>
            <button
              type="button"
              disabled={pending}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-0 bg-orange-400 px-6 py-5 font-sans text-[18px] font-bold tracking-[0.018px] text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onNext}
            >
              Далее
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
