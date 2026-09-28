import type { ListingTableRow } from "./ListingTableRow";
import { MOCK_ALL_LISTINGS } from "./mockAllListings";
import { readAllListingsFromStorage } from "./readAllListingsFromStorage";
import { writeAllListingsToStorage } from "./writeAllListingsToStorage";

/** Начальное состояние таблицы: из Storage или сид моками с записью. */
export function loadAllListingsInitial(
  storage: Storage = localStorage,
): ListingTableRow[] {
  const stored = readAllListingsFromStorage(storage);
  if (stored !== null) {
    return stored;
  }
  const seeded = [...MOCK_ALL_LISTINGS];
  writeAllListingsToStorage(storage, seeded);
  return seeded;
}
