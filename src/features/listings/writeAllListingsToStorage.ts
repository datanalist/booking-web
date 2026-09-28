import { ALL_LISTINGS_STORAGE_KEY } from "./allListingsStorageKey";
import type { ListingTableRow } from "./ListingTableRow";

/** Сохраняет строки таблицы «Мои объявления» в Storage. */
export function writeAllListingsToStorage(
  storage: Storage,
  items: readonly ListingTableRow[],
): void {
  storage.setItem(ALL_LISTINGS_STORAGE_KEY, JSON.stringify(items));
}
