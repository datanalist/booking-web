import { useId } from "react";
import type { HousingType } from "../api/types";
import { HOUSING_LABELS } from "../config";

type WizardHousingSelectProps = {
  value: HousingType | "";
  onChange: (value: HousingType | "") => void;
  error?: string;
};

export function WizardHousingSelect({
  value,
  onChange,
  error,
}: WizardHousingSelectProps) {
  const id = useId();
  const showPlaceholder = value === "";

  return (
    <div className="flex w-full min-w-0 flex-col gap-1 overflow-hidden rounded-[8px] font-sans">
      <label htmlFor={id} className="text-[14px] font-normal text-[#525353]">
        Вид жилья
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => {
            const next = event.target.value as HousingType | "";
            onChange(next);
          }}
          className={[
            "box-border h-[44px] w-full appearance-none rounded-[8px] border border-solid bg-[rgba(251,192,40,0.06)] px-[14px] py-[10px] pr-10 font-sans text-[16px] outline-none",
            error ? "border-[#e34043]" : "border-[rgba(251,192,40,0.17)]",
            showPlaceholder ? "text-[#525353]" : "text-[var(--color-ink)]",
          ].join(" ")}
        >
          <option value="" disabled>
            Укажите вид жилья
          </option>
          {(Object.keys(HOUSING_LABELS) as HousingType[]).map((key) => (
            <option key={key} value={key}>
              {HOUSING_LABELS[key]}
            </option>
          ))}
        </select>
        <img
          src="/icon-arrow-down.svg"
          alt=""
          width={13.17}
          height={7.33}
          className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2"
        />
      </div>
      {error ? (
        <span className="text-[14px] font-normal text-[#e34043]">{error}</span>
      ) : null}
    </div>
  );
}
