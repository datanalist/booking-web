import type { CSSProperties, Ref } from "react";
import {
  listingRowMenuItemsByStatus,
  type ListingRowMenuActionId,
} from "./listingRowMenuItemsByStatus";
import type { ListingTableStatus } from "./listingTableStatus";

type ListingRowMenuProps = {
  status: ListingTableStatus;
  onAction: (actionId: ListingRowMenuActionId) => void;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
};

/** Поповер действий строки «Все объявления» — пункты зависят от статуса. */
export function ListingRowMenu({
  status,
  onAction,
  style,
  ref,
}: ListingRowMenuProps) {
  const items = listingRowMenuItemsByStatus(status);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Действия с объявлением"
      data-listing-row-menu=""
      style={style}
      className="z-50 flex w-max flex-col gap-4 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl bg-white py-5 pl-5 pr-7 shadow-[0_0_2px_rgba(23,24,32,0.06),0_12px_18px_rgba(23,24,32,0.07)]"
    >
      {items.map((item, index) => {
        const isDanger = item.tone === "danger";
        const colorClass = isDanger
          ? "text-red-500"
          : "text-[var(--color-ink)]";
        return (
          <div key={item.id} className="contents">
            {index > 0 ? (
              <div
                aria-hidden
                className="h-px w-full bg-[rgba(26,27,29,0.12)]"
              />
            ) : null}
            <button
              type="button"
              role="menuitem"
              className={`flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-[14px] leading-[1.4] ${colorClass}`}
              onClick={() => onAction(item.id)}
            >
              <item.Icon
                aria-hidden
                className="size-6 shrink-0"
                strokeWidth={1.5}
              />
              <span>{item.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
