import { ALL_LISTINGS_STORAGE_KEY } from "./allListingsStorageKey";
import type { ListingTableRow } from "./ListingTableRow";
import { parseListingTableRows } from "./parseListingTableRows";

/**
 * Читает строки таблицы из Storage.
 * null — ключа нет или JSON/данные битые (нужен сид моками).
 */
export function readAllListingsFromStorage(
  storage: Storage,
): ListingTableRow[] | null {
  const raw = storage.getItem(ALL_LISTINGS_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    return parseListingTableRows(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}
