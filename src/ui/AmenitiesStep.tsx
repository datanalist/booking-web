/** Единая причина изменения: UI шага «3. Удобства» мастера объявления по макету. */
import { ChevronLeft } from "lucide-react";
import type { AmenityId, ExtraAmenityId } from "../api/types";
import { AMENITY_LABELS, EXTRA_AMENITY_LABELS } from "../config";
import {
  AMENITY_ICONS,
  EXTRA_AMENITY_ICONS,
} from "../lib/amenityIconMap";
import { AmenityChip } from "./AmenityChip";
import { Button } from "./Button";

const STEP_LABELS = [
  "Описание",
  "Фото",
  "Удобства",
  "Правила",
  "Дополнительное",
  "Стоимость",
] as const;

type AmenitiesStepProps = {
  selectedAmenities: ReadonlySet<AmenityId>;
  selectedExtras: ReadonlySet<ExtraAmenityId>;
  pending: boolean;
  onToggleAmenity: (id: AmenityId) => void;
  onToggleExtra: (id: ExtraAmenityId) => void;
  onBack: () => void;
  onNext: () => void;
};

export function AmenitiesStep({
  selectedAmenities,
  selectedExtras,
  pending,
  onToggleAmenity,
  onToggleExtra,
  onBack,
  onNext,
}: AmenitiesStepProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-8 overflow-auto bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <header className="flex items-center gap-5">
        <button
          type="button"
          aria-label="Назад"
          onClick={onBack}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[30px] border border-solid border-[#ffe4b8] bg-white p-2"
        >
          <ChevronLeft className="size-6 text-[var(--color-ink)]" strokeWidth={1.75} />
        </button>
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Создание объявления
        </h1>
      </header>

      <nav
        aria-label="Шаги создания объявления"
        className="flex w-full items-start border-b border-solid border-[#ffe4b8]"
      >
        {STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const reached = step <= 3;
          return (
            <div
              key={label}
              className={`flex flex-1 items-center justify-center p-2.5 ${
                reached
                  ? "border-b-2 border-solid border-[var(--color-ink)]"
                  : ""
              }`}
            >
              <span
                className={`whitespace-nowrap text-[14px] leading-[1.4] ${
                  reached ? "text-[var(--color-ink)]" : "text-[#525353]"
                }`}
              >
                {step}. {label}
              </span>
            </div>
          );
        })}
      </nav>

      <section className="flex min-h-0 flex-1 flex-col items-center rounded-2xl border border-solid border-[rgba(251,192,40,0.17)] bg-white">
        <div className="flex w-full max-w-[437px] flex-col gap-8 py-10">
          <h2 className="m-0 text-[18px] font-bold tracking-[0.018px] text-[var(--color-ink)]">
            Укажите удобства и дополнительные характеристики жилья
          </h2>

          <div className="flex flex-col gap-3">
            <p className="m-0 text-[16px] leading-[1.45] text-[var(--color-ink)]">
              Удобства
            </p>
            <div className="flex flex-wrap content-start gap-2.5">
              {(Object.keys(AMENITY_LABELS) as AmenityId[]).map((id) => (
                <AmenityChip
                  key={id}
                  label={AMENITY_LABELS[id]}
                  icon={AMENITY_ICONS[id]}
                  selected={selectedAmenities.has(id)}
                  onToggle={() => onToggleAmenity(id)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="m-0 text-[16px] leading-[1.45] text-[var(--color-ink)]">
              Дополнительные характеристики
            </p>
            <div className="flex flex-wrap content-start gap-2.5">
              {(Object.keys(EXTRA_AMENITY_LABELS) as ExtraAmenityId[]).map(
                (id) => (
                  <AmenityChip
                    key={id}
                    label={EXTRA_AMENITY_LABELS[id]}
                    icon={EXTRA_AMENITY_ICONS[id]}
                    selected={selectedExtras.has(id)}
                    onToggle={() => onToggleExtra(id)}
                  />
                ),
              )}
            </div>
          </div>

          <div className="flex gap-5">
            <Button
              variant="outlined"
              disabled={pending}
              className="h-auto flex-1 rounded-lg px-6 py-5"
              onClick={onBack}
            >
              Вернуться
            </Button>
            <Button
              disabled={pending}
              className="h-auto flex-1 rounded-lg px-6 py-5"
              onClick={onNext}
            >
              Далее
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
