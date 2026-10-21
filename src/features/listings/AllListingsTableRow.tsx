import { HOUSING_LABELS } from "../../config";
import type { ListingRowMenuActionId } from "./listingRowMenuItemsByStatus";
import type { ListingTableRow as ListingTableRowData } from "./ListingTableRow";
import { ListingRowMenuButton } from "./ListingRowMenuButton";
import { ListingStatusBadge } from "./ListingStatusBadge";
import { ListingThumb } from "./ListingThumb";

type AllListingsTableRowProps = {
  item: ListingTableRowData;
  menuOpen: boolean;
  onMenuOpenChange: (listingId: string | null) => void;
  onMenuAction: (actionId: ListingRowMenuActionId) => void;
  onOpen: (listingId: string) => void;
};

export function AllListingsTableRow({
  item,
  menuOpen,
  onMenuOpenChange,
  onMenuAction,
  onOpen,
}: AllListingsTableRowProps) {
  return (
    <div
      role="row"
      tabIndex={0}
      aria-label={`Открыть объявление ${item.title}`}
      onClick={() => onOpen(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item.id);
        }
      }}
      className="col-span-full grid min-h-[76px] cursor-pointer grid-cols-subgrid items-center border-b border-amber-400/20 bg-white last:border-b-0"
    >
      <div
        role="cell"
        className="flex min-w-0 items-center gap-3 px-6 py-2.5 text-[14px] leading-[1.4] text-[var(--color-ink)]"
      >
        <ListingThumb src={item.coverUrl} alt={item.title} />
        <span className="min-w-0">{item.title}</span>
      </div>
      <div
        role="cell"
        className="min-w-0 px-6 py-2.5 text-[14px] leading-[1.4] text-[var(--color-ink)]"
      >
        {item.address}
      </div>
      <div
        role="cell"
        className="px-6 py-2.5 text-[14px] leading-[1.4] text-[var(--color-ink)]"
      >
        {HOUSING_LABELS[item.housingType]}
      </div>
      <div role="cell" className="w-max px-6 py-2.5">
        <ListingStatusBadge status={item.status} />
      </div>
      <div
        role="cell"
        className="flex items-center justify-center px-4 py-2.5"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.stopPropagation();
          }
        }}
      >
        <ListingRowMenuButton
          listingId={item.id}
          listingTitle={item.title}
          status={item.status}
          open={menuOpen}
          onOpenChange={onMenuOpenChange}
          onAction={onMenuAction}
        />
      </div>
    </div>
  );
}
