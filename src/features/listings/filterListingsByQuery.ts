import type { ListingTableRow } from "./ListingTableRow";

export function filterListingsByQuery(
  items: readonly ListingTableRow[],
  query: string,
): ListingTableRow[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return [...items];
  }
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(normalized) ||
      item.address.toLowerCase().includes(normalized),
  );
}
