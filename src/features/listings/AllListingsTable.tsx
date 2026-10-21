import type { ListingRowMenuActionId } from "./listingRowMenuItemsByStatus";
import type { ListingTableRow } from "./ListingTableRow";
import { AllListingsTableRow } from "./AllListingsTableRow";

type AllListingsTableProps = {
  items: readonly ListingTableRow[];
  openMenuId: string | null;
  onOpenMenuChange: (id: string | null) => void;
  onMenuAction: (listingId: string, actionId: ListingRowMenuActionId) => void;
  onOpenListing: (listingId: string) => void;
  ariaLabel?: string;
};

const HEADER_CELLS = [
  "Название",
  "Адрес",
  "Вид жилья",
  "Статус",
  "",
] as const;

/** Статус — не уже подписи; остальные колонки на прежних долях. */
const TABLE_COLUMNS =
  "grid-cols-[minmax(0,2.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_minmax(max-content,1.2fr)_56px]";

export function AllListingsTable({
  items,
  openMenuId,
  onOpenMenuChange,
  onMenuAction,
  onOpenListing,
  ariaLabel = "Все объявления",
}: AllListingsTableProps) {
  return (
    <div
      role="table"
      aria-label={ariaLabel}
      className={`grid w-full overflow-visible rounded-2xl outline outline-amber-400/20 ${TABLE_COLUMNS}`}
    >
      <div
        role="row"
        className="col-span-full grid grid-cols-subgrid items-center bg-amber-400/20"
      >
        {HEADER_CELLS.map((label, index) => (
          <div
            key={label === "" ? "actions" : label}
            role="columnheader"
            className={`flex h-[52px] items-center px-6 text-[14px] font-bold leading-[1.4] text-[var(--color-ink)] opacity-90 ${
              index === HEADER_CELLS.length - 1 ? "px-4" : ""
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      {items.map((item) => (
        <AllListingsTableRow
          key={item.id}
          item={item}
          menuOpen={openMenuId === item.id}
          onMenuOpenChange={onOpenMenuChange}
          onMenuAction={(actionId) => onMenuAction(item.id, actionId)}
          onOpen={onOpenListing}
        />
      ))}
    </div>
  );
}
