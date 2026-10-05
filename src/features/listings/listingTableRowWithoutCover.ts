import type { ListingTableRow } from "./ListingTableRow";

/** Строка таблицы без обложки — запасной вариант при переполнении Storage. */
export function listingTableRowWithoutCover(
  row: ListingTableRow,
): ListingTableRow {
  return {
    id: row.id,
    title: row.title,
    address: row.address,
    housingType: row.housingType,
    status: row.status,
  };
}
