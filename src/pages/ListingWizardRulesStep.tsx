/** Единая причина изменения: форма шага «4. Правила» мастера объявления. */
import { isRulesStepComplete } from "../lib/isRulesStepComplete";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { WizardCheckbox } from "../ui/WizardCheckbox";

export type ListingWizardRulesValues = {
  maxGuests: number;
  checkInTime: string;
  checkOutTime: string;
  petsAllowed: boolean;
  cancellationAllowed: boolean;
};

type ListingWizardRulesStepProps = {
  values: ListingWizardRulesValues;
  errors: Partial<Record<keyof ListingWizardRulesValues, string>>;
  pending: boolean;
  onChange: (partial: Partial<ListingWizardRulesValues>) => void;
  onBack: () => void;
  onNext: () => void;
};

export function ListingWizardRulesStep({
  values,
  errors,
  pending,
  onChange,
  onBack,
  onNext,
}: ListingWizardRulesStepProps) {
  const canNext = !pending && isRulesStepComplete(values);

  return (
    <div className="flex w-full max-w-[437px] flex-col gap-8 py-10 font-sans">
      <h2 className="m-0 text-[18px] font-bold tracking-[0.018px] text-[var(--color-ink)]">
        Укажите правила жилья
      </h2>

      <Input
        variant="auth"
        label="Количество гостей"
        type="number"
        placeholder="Введите максимальное количество гостей"
        value={values.maxGuests > 0 ? String(values.maxGuests) : ""}
        onChange={(raw) =>
          onChange({ maxGuests: raw === "" ? 0 : Number(raw) })
        }
        error={errors.maxGuests}
      />

      <div className="flex w-full gap-8">
        <Input
          variant="auth"
          label="Время заселения"
          type="text"
          placeholder="Введите время"
          value={values.checkInTime}
          onChange={(raw) => onChange({ checkInTime: raw })}
          error={errors.checkInTime}
        />
        <Input
          variant="auth"
          label="Время выселения"
          type="text"
          placeholder="Введите время"
          value={values.checkOutTime}
          onChange={(raw) => onChange({ checkOutTime: raw })}
          error={errors.checkOutTime}
        />
      </div>

      <div className="flex flex-col gap-4">
        <WizardCheckbox
          label="Можно с животными"
          checked={values.petsAllowed}
          onChange={(checked) => onChange({ petsAllowed: checked })}
        />
        <WizardCheckbox
          label="Можно отменять бронирование"
          checked={values.cancellationAllowed}
          onChange={(checked) => onChange({ cancellationAllowed: checked })}
        />
      </div>

      <div className="flex w-full gap-5">
        <Button
          variant="outlined"
          disabled={pending}
          onClick={onBack}
          className="h-auto min-h-[61px] flex-1 rounded-[8px] px-6 py-5"
        >
          Вернуться
        </Button>
        <Button
          disabled={!canNext}
          onClick={onNext}
          className="h-auto min-h-[61px] flex-1 rounded-[8px] px-6 py-5 disabled:opacity-40"
        >
          Далее
        </Button>
      </div>
    </div>
  );
}
