import {
  LISTING_TABLE_STATUSES,
  type ListingTableStatus,
} from "./listingTableStatus";

const STATUS_SET: ReadonlySet<string> = new Set(LISTING_TABLE_STATUSES);

/** Parse, don't validate: неизвестная строка → null. */
export function parseListingTableStatus(
  value: unknown,
): ListingTableStatus | null {
  if (typeof value !== "string" || !STATUS_SET.has(value)) {
    return null;
  }
  return value as ListingTableStatus;
}
