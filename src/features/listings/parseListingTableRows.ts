import type { ListingTableRow } from "./ListingTableRow";
import { parseListingTableRow } from "./parseListingTableRow";

/** Разбирает массив строк таблицы; любой битый элемент → null всего массива. */
export function parseListingTableRows(
  value: unknown,
): ListingTableRow[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const rows: ListingTableRow[] = [];
  for (const item of value) {
    const row = parseListingTableRow(item);
    if (row === null) {
      return null;
    }
    rows.push(row);
  }
  return rows;
}
