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
import { ListingPreviewNumberedLines } from "./ListingPreviewNumberedLines";
import { ListingPreviewPriceCard } from "./ListingPreviewPriceCard";
import { ListingPreviewRuleCard } from "./ListingPreviewRuleCard";
import { ListingStatusBadge } from "./ListingStatusBadge";
import type { ListingPreviewDisplay } from "./toListingPreviewDisplay";

type ListingPreviewViewProps = {
  data: ListingPreviewDisplay;
};

/** Белая карточка предпросмотра объявления (контент справа от сайдбара). */
export function ListingPreviewView({
  data,
}: ListingPreviewViewProps): ReactElement {
  return (
    <div className="flex w-full gap-6 rounded-2xl border border-solid border-amber-400/20 bg-white p-6">
      <ListingPreviewGallery photos={data.photos} />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="m-0 text-lg font-bold tracking-tight text-[var(--color-ink)]">
              {data.title}
            </h2>
            <ListingStatusBadge status={data.status} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-sm leading-[1.4] text-neutral-600">
              <MapPin
                aria-hidden
                className="size-4 shrink-0 text-[var(--color-accent)]"
                strokeWidth={1.75}
              />
              <span>{data.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm leading-[1.4] text-neutral-600">
              <Home
                aria-hidden
                className="size-4 shrink-0 text-[var(--color-accent)]"
                strokeWidth={1.75}
              />
              <span>{HOUSING_LABELS[data.housingType]}</span>
            </div>
          </div>
          <p className="m-0 whitespace-pre-wrap text-sm leading-[1.4] text-[var(--color-ink)]">
            {data.description}
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-base font-bold leading-[1.2] text-[var(--color-ink)]">
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
          <h3 className="m-0 text-base font-bold leading-[1.2] text-[var(--color-ink)]">
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
          <h3 className="m-0 text-base font-bold leading-[1.2] text-[var(--color-ink)]">
            Правила жилья
          </h3>
          <div className="flex flex-wrap gap-3">
            <ListingPreviewRuleCard
              label="Количество гостей (макс.)"
              value={data.maxGuestsLabel}
            />
            <ListingPreviewRuleCard
              label="Проживание с животными"
              value={data.petsLabel}
            />
            <ListingPreviewRuleCard label="Заселение" value={data.checkInTime} />
            <ListingPreviewRuleCard
              label="Выселение"
              value={data.checkOutTime}
            />
          </div>
        </section>

        <div className="flex gap-6">
          <section className="flex min-w-0 flex-1 flex-col gap-3">
            <h3 className="m-0 text-base font-bold leading-[1.2] text-[var(--color-ink)]">
              Как попасть внутрь
            </h3>
            <ListingPreviewNumberedLines lines={data.accessInfoLines} />
          </section>
          <section className="flex min-w-0 flex-1 flex-col gap-3">
            <h3 className="m-0 text-base font-bold leading-[1.2] text-[var(--color-ink)]">
              Правила проживания
            </h3>
            <ListingPreviewNumberedLines lines={data.houseRulesLines} />
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="m-0 text-base font-bold leading-[1.2] text-[var(--color-ink)]">
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
            <h3 className="m-0 text-base font-bold leading-[1.2] text-[var(--color-ink)]">
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
