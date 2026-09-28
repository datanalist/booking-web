import { MapPin, Home } from "lucide-react";
import type { ReactElement } from "react";
import {
  AMENITY_LABELS,
  EXTRA_AMENITY_LABELS,
  HOUSING_LABELS,
} from "../../config";
import {
  AMENITY_ICONS,
  EXTRA_AMENITY_ICONS,
} from "../../lib/amenityIconMap";
import { ListingPreviewAmenityPill } from "./ListingPreviewAmenityPill";
import { ListingPreviewGallery } from "./ListingPreviewGallery";
import { ListingPreviewPriceCard } from "./ListingPreviewPriceCard";
import type { ListingPreviewDisplay } from "./toListingPreviewDisplay";

type ListingPreviewViewProps = {
  data: ListingPreviewDisplay;
};

function RuleCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-solid border-amber-400/20 bg-amber-400/5 p-3 text-[14px] leading-[1.4]">
      <p className="m-0 text-[#525353]">{label}</p>
      <p className="m-0 font-bold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function NumberedLines({ lines }: { lines: string[] }): ReactElement {
  return (
    <ol className="m-0 flex list-decimal flex-col gap-2 py-0 pl-5 text-[14px] leading-[1.4] text-[var(--color-ink)]">
      {lines.map((line) => (
        <li key={line} className="pl-1">
          {line}
        </li>
      ))}
    </ol>
  );
}

/** Белая карточка предпросмотра объявления (контент справа от сайдбара). */
export function ListingPreviewView({
  data,
}: ListingPreviewViewProps): ReactElement {
  return (
    <div className="flex w-full gap-6 rounded-2xl border border-solid border-amber-400/20 bg-white p-6">
      <ListingPreviewGallery photos={data.photos} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-[18px] font-bold tracking-[0.018px] text-[var(--color-ink)]">
            {data.title}
          </h2>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[14px] leading-[1.4] text-[#525353]">
              <MapPin aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
              <span>{data.address}</span>
            </div>
            <div className="flex items-center gap-2 text-[14px] leading-[1.4] text-[#525353]">
              <Home aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
              <span>{HOUSING_LABELS[data.housingType]}</span>
            </div>
          </div>
          <p className="m-0 whitespace-pre-wrap text-[14px] leading-[1.4] text-[var(--color-ink)]">
            {data.description}
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
            Удобства
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.amenityIds.map((id) => (
              <ListingPreviewAmenityPill
                key={id}
                label={AMENITY_LABELS[id]}
                icon={AMENITY_ICONS[id]}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
            Дополнительные характеристики
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.extraAmenityIds.map((id) => (
              <ListingPreviewAmenityPill
                key={id}
                label={EXTRA_AMENITY_LABELS[id]}
                icon={EXTRA_AMENITY_ICONS[id]}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
            Правила жилья
          </h3>
          <div className="flex flex-wrap gap-3">
            <RuleCard
              label="Количество гостей (макс.)"
              value={data.maxGuestsLabel}
            />
            <RuleCard
              label="Проживание с животными"
              value={data.petsLabel}
            />
            <RuleCard label="Заселение" value={data.checkInTime} />
            <RuleCard label="Выселение" value={data.checkOutTime} />
          </div>
        </section>

        <div className="flex gap-6">
          <section className="flex min-w-0 flex-1 flex-col gap-3">
            <h3 className="m-0 text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
              Как попасть внутрь
            </h3>
            <NumberedLines lines={data.accessInfoLines} />
          </section>
          <section className="flex min-w-0 flex-1 flex-col gap-3">
            <h3 className="m-0 text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
              Правила проживания
            </h3>
            <NumberedLines lines={data.houseRulesLines} />
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
            Стоимость жилья за сутки
          </h3>
          <div className="flex flex-wrap gap-3">
            {data.priceTiers.map((tier) => (
              <ListingPreviewPriceCard
                key={tier.label}
                label={tier.label}
                base={tier.base}
              />
            ))}
          </div>
        </section>

        {data.uniquePrices.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h3 className="m-0 text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
              Уникальная стоимость жилья за сутки
            </h3>
            <div className="flex flex-wrap gap-3">
              {data.uniquePrices.map((tier) => (
                <ListingPreviewPriceCard
                  key={tier.label}
                  label={tier.label}
                  base={tier.base}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
