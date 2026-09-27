import type { HousingType } from "../api/types";
import { DESCRIPTION_MAX } from "../config";
import { Button } from "./Button";
import { Input } from "./Input";
import { WizardHousingSelect } from "./WizardHousingSelect";

type WizardDescriptionFormProps = {
  title: string;
  address: string;
  housingType: HousingType | "";
  description: string;
  errors: Record<string, string>;
  nextEnabled: boolean;
  pending: boolean;
  onTitleChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onHousingChange: (value: HousingType | "") => void;
  onDescriptionChange: (value: string) => void;
  onNext: () => void;
};

export function WizardDescriptionForm({
  title,
  address,
  housingType,
  description,
  errors,
  nextEnabled,
  pending,
  onTitleChange,
  onAddressChange,
  onHousingChange,
  onDescriptionChange,
  onNext,
}: WizardDescriptionFormProps) {
  return (
    <div className="flex w-[437px] max-w-full flex-col items-start gap-8 py-10 font-sans">
      <h2 className="m-0 text-[18px] font-bold tracking-[0.018px] text-[var(--color-ink)]">
        Заполните сведения о жилье
      </h2>

      <Input
        label="Название"
        variant="auth"
        value={title}
        placeholder="Введите название объявления"
        onChange={onTitleChange}
        error={errors.title}
      />

      <Input
        label="Адрес"
        variant="auth"
        value={address}
        placeholder="Введите адрес жилья"
        onChange={onAddressChange}
        error={errors.address}
      />

      <WizardHousingSelect
        value={housingType}
        onChange={onHousingChange}
        error={errors.housingType}
      />

      <div className="flex w-full flex-col items-end gap-1">
        <Input
          label="Описание"
          variant="auth"
          value={description}
          placeholder="Добавьте описание жилья"
          multiline
          maxLength={DESCRIPTION_MAX}
          onChange={onDescriptionChange}
          error={errors.description}
        />
        <p className="m-0 text-[12px] leading-[1.5] text-[#525353]">
          {description.length}/{DESCRIPTION_MAX}
        </p>
      </div>

      <Button
        disabled={!nextEnabled || pending}
        onClick={onNext}
        className="h-auto w-full !rounded-lg !px-6 !py-5 disabled:opacity-40"
      >
        Далее
      </Button>
    </div>
  );
}
