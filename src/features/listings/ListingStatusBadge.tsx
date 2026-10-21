import {
  LISTING_TABLE_STATUS_BADGE_CLASS,
  LISTING_TABLE_STATUS_LABELS,
  type ListingTableStatus,
} from "./listingTableStatus";

type ListingStatusBadgeProps = {
  status: ListingTableStatus;
};

export function ListingStatusBadge({ status }: ListingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-max shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs leading-[1.5] text-[var(--color-ink)] ${LISTING_TABLE_STATUS_BADGE_CLASS[status]}`}
    >
      {LISTING_TABLE_STATUS_LABELS[status]}
    </span>
  );
}
