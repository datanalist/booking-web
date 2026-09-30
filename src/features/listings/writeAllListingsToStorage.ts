import { ALL_LISTINGS_STORAGE_KEY } from "./allListingsStorageKey";
import { listingTableRowWithoutCover } from "./listingTableRowWithoutCover";
import type { ListingTableRow } from "./ListingTableRow";
import { toPersistedListingTableRow } from "./toPersistedListingTableRow";
import { trySetStorageItem } from "../../lib/trySetStorageItem";

/** Сохраняет лёгкие строки таблицы в Storage; квота/ошибки — без throw. */
export function writeAllListingsToStorage(
  storage: Storage,
  items: readonly ListingTableRow[],
): void {
  const light = items.map(toPersistedListingTableRow);
  const payload = JSON.stringify(light);
  if (trySetStorageItem(storage, ALL_LISTINGS_STORAGE_KEY, payload)) {
    return;
  }
  const bare = light.map(listingTableRowWithoutCover);
  trySetStorageItem(
    storage,
    ALL_LISTINGS_STORAGE_KEY,
    JSON.stringify(bare),
  );
}
