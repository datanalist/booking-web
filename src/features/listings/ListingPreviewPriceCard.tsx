import type { ReactElement } from "react";
import { clientPriceOf, commissionOf, formatRub } from "../../lib/money";

type ListingPreviewPriceCardProps = {
  label: string;
  base: number;
};

/** Карточка тарифа: база / комиссия / итог (макет Figma 1:20382). */
export function ListingPreviewPriceCard({
  label,
  base,
}: ListingPreviewPriceCardProps): ReactElement {
  return (
    <div className="flex min-w-[240px] flex-1 flex-col gap-2 rounded-lg border border-solid border-amber-400/20 bg-amber-400/5 p-3 text-[14px] leading-[1.4]">
      <p className="m-0 text-[#525353]">{label}</p>
      <div className="flex flex-col gap-1 text-[var(--color-ink)]">
        <div className="flex items-center justify-between gap-3">
          <span>Стоимость для клиента:</span>
          <span className="shrink-0 font-bold">{formatRub(base)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Комиссия сервиса:</span>
          <span className="shrink-0 font-bold">
            {formatRub(commissionOf(base))}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Стоимость с комиссией:</span>
          <span className="shrink-0 font-bold">
            {formatRub(clientPriceOf(base))}
          </span>
        </div>
      </div>
    </div>
  );
}
