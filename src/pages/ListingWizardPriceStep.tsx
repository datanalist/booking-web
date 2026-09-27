/** UI шага «6. Стоимость» мастера объявления (макет Figma 1:19966 / 1:20276). */
import { commissionOf, clientPriceOf, formatRub, rub } from "../lib/money";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Switch";

export type UniquePriceRow = { date: string; base: number };

type ListingWizardPriceStepProps = {
  priceNight: number;
  priceFrom14: number;
  priceFrom28: number;
  uniqueOn: boolean;
  uniquePrices: UniquePriceRow[];
  errors: Record<string, string>;
  pending: boolean;
  onPriceNight: (value: number) => void;
  onPriceFrom14: (value: number) => void;
  onPriceFrom28: (value: number) => void;
  onUniqueOn: (on: boolean) => void;
  onUniquePrices: (rows: UniquePriceRow[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export function ListingWizardPriceStep({
  priceNight,
  priceFrom14,
  priceFrom28,
  uniqueOn,
  uniquePrices,
  errors,
  pending,
  onPriceNight,
  onPriceFrom14,
  onPriceFrom28,
  onUniqueOn,
  onUniquePrices,
  onBack,
  onNext,
}: ListingWizardPriceStepProps) {
  function patchRow(index: number, partial: Partial<UniquePriceRow>): void {
    const next = uniquePrices.map((row, i) =>
      i === index ? { ...row, ...partial } : row,
    );
    onUniquePrices(next);
  }

  return (
    <div className="flex w-full max-w-[467px] flex-col gap-8 py-10 font-sans">
      <p className="m-0 text-[18px] font-bold tracking-[0.018px] text-[var(--color-ink)]">
        Укажите стоимость жилья за сутки
      </p>

      <PriceTierField
        label="Аренда до 14 дней"
        value={priceNight}
        error={errors.priceNight}
        onChange={onPriceNight}
      />
      <PriceTierField
        label="Аренда от 14 до 28 дней"
        value={priceFrom14}
        error={errors.priceFrom14}
        onChange={onPriceFrom14}
      />
      <PriceTierField
        label="Аренда на 28 дней и более"
        value={priceFrom28}
        error={errors.priceFrom28}
        onChange={onPriceFrom28}
      />

      <Switch
        checked={uniqueOn}
        label="Добавить уникальную стоимость для конкретных дат"
        onChange={onUniqueOn}
      />

      {uniqueOn ? (
        <div className="flex flex-col gap-8">
          <p className="m-0 text-[18px] font-bold tracking-[0.018px] text-[var(--color-ink)]">
            Укажите даты и уникальную стоимость за сутки
          </p>
          {uniquePrices.map((row, index) => (
            <UniquePriceBlock
              key={index}
              index={index}
              row={row}
              onChange={(partial) => patchRow(index, partial)}
              onRemove={() =>
                onUniquePrices(uniquePrices.filter((_, i) => i !== index))
              }
            />
          ))}
          {errors.uniquePrices ? (
            <p className="m-0 text-[14px] text-[#e34043]">{errors.uniquePrices}</p>
          ) : null}
          <button
            type="button"
            className="cursor-pointer self-start border-0 bg-transparent p-1 text-[14px] font-bold leading-[1.4] text-[var(--color-accent)] underline"
            onClick={() =>
              onUniquePrices([...uniquePrices, { date: "", base: 0 }])
            }
          >
            Добавить еще
          </button>
        </div>
      ) : null}

      <div className="flex gap-5">
        <Button
          variant="outlined"
          disabled={pending}
          className="h-auto min-h-[61px] flex-1 rounded-[8px] px-6 py-5"
          onClick={onBack}
        >
          Вернуться
        </Button>
        <Button
          disabled={pending}
          className="h-auto min-h-[61px] flex-1 rounded-[8px] px-6 py-5"
          onClick={onNext}
        >
          Далее
        </Button>
      </div>
    </div>
  );
}

function PriceTierField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  const amount = rub(value);
  const commission = amount > 0 ? commissionOf(amount) : rub(0);
  const client = amount > 0 ? clientPriceOf(amount) : rub(0);
  const hasValue = amount > 0;

  return (
    <div className="flex w-full flex-col gap-3">
      <MoneyField
        label={label}
        value={value}
        error={error}
        onChange={onChange}
      />
      <div className="flex flex-col gap-1.5 text-[14px] leading-[1.4] text-[var(--color-ink)]">
        <p className="m-0 flex items-center gap-2">
          <span>Комиссия сервиса:</span>
          <span className={hasValue ? "font-bold" : "font-normal"}>
            {formatRub(commission)}
          </span>
        </p>
        <p className="m-0 flex items-center gap-2">
          <span>Стоимость с учетом комиссии:</span>
          <span className={hasValue ? "font-bold" : "font-normal"}>
            {formatRub(client)}
          </span>
        </p>
      </div>
    </div>
  );
}

function MoneyField({
  label,
  value,
  error,
  onChange,
  placeholder = "Введите стоимость",
}: {
  label: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  const display = value > 0 ? String(value) : "";

  return (
    <div className="flex w-full flex-col gap-1">
      <label className="text-[14px] font-normal leading-[1.4] text-[#525353]">
        {label}
      </label>
      <div
        className={`box-border flex h-11 items-center rounded-[8px] border bg-[rgba(251,192,40,0.06)] px-[14px] py-2.5 ${
          error
            ? "border-[#e34043]"
            : "border-[rgba(251,192,40,0.17)]"
        }`}
      >
        <input
          type="text"
          inputMode="numeric"
          className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[16px] leading-[1.45] text-[var(--color-ink)] outline-none placeholder:text-[#525353]"
          value={display}
          placeholder={placeholder}
          aria-label={label}
          onChange={(event) => {
            const raw = event.target.value.replace(/\D/g, "");
            onChange(raw === "" ? 0 : Number(raw));
          }}
        />
        <span
          aria-hidden
          className="shrink-0 pl-2 text-[16px] leading-[1.45] text-[#525353]"
        >
          ₽
        </span>
      </div>
      {error ? (
        <span className="text-[14px] font-normal text-[#e34043]">{error}</span>
      ) : null}
    </div>
  );
}

function UniquePriceBlock({
  index,
  row,
  onChange,
  onRemove,
}: {
  index: number;
  row: UniquePriceRow;
  onChange: (partial: Partial<UniquePriceRow>) => void;
  onRemove: () => void;
}) {
  const amount = rub(row.base);
  const commission = amount > 0 ? commissionOf(amount) : rub(0);
  const client = amount > 0 ? clientPriceOf(amount) : rub(0);
  const hasValue = amount > 0;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between border-b border-[rgba(251,192,40,0.17)] pb-2">
        <p className="m-0 text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Дата {index + 1}
        </p>
        <button
          type="button"
          className="flex size-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
          aria-label={`Удалить дату ${index + 1}`}
          onClick={onRemove}
        >
          <img src="/icon-delete.svg" alt="" width={16} height={17} />
        </button>
      </div>
      <div className="flex flex-wrap items-start gap-8">
        <div className="flex w-[140px] flex-col gap-1">
          <label className="text-[14px] font-normal leading-[1.4] text-[#525353]">
            Дата
          </label>
          <div className="relative box-border flex h-11 items-center rounded-[8px] border border-[rgba(251,192,40,0.17)] bg-[rgba(251,192,40,0.06)] px-[14px] py-2.5">
            <input
              type="date"
              className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[16px] leading-[1.45] text-[var(--color-ink)] outline-none [-webkit-calendar-picker-indicator]:absolute [-webkit-calendar-picker-indicator]:inset-0 [-webkit-calendar-picker-indicator]:h-full [-webkit-calendar-picker-indicator]:w-full [-webkit-calendar-picker-indicator]:cursor-pointer [-webkit-calendar-picker-indicator]:opacity-0"
              value={row.date}
              aria-label={`Дата ${index + 1}`}
              onChange={(event) => onChange({ date: event.target.value })}
            />
            <img
              src="/icon-calendar.svg"
              alt=""
              width={16}
              height={18}
              className="pointer-events-none shrink-0"
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <MoneyField
            label="Аренда за сутки"
            value={row.base}
            onChange={(base) => onChange({ base })}
          />
          <div className="flex flex-col gap-1.5 text-[14px] leading-[1.4] text-[var(--color-ink)]">
            <p className="m-0 flex items-center gap-2">
              <span>Комиссия сервиса:</span>
              <span className={hasValue ? "font-bold" : "font-normal"}>
                {formatRub(commission)}
              </span>
            </p>
            <p className="m-0 flex items-center gap-2">
              <span>Стоимость с учетом комиссии:</span>
              <span className={hasValue ? "font-bold" : "font-normal"}>
                {formatRub(client)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
