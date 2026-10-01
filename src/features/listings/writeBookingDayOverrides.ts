import { trySetStorageItem } from "../../lib/trySetStorageItem";
import type { BookingDayOverrides } from "./BookingDayOverrides";
import { bookingCalendarBlocksKey } from "./bookingCalendarBlocksKey";

/** Пишет блокировки. При ошибке Storage возвращает false и не бросает. */
export function writeBookingDayOverrides(
  storage: Storage,
  listingId: string,
  overrides: BookingDayOverrides,
): boolean {
  const payload = JSON.stringify({
    blocked: [...overrides.blocked].sort(),
    released: [...overrides.released].sort(),
  });
  return trySetStorageItem(
    storage,
    bookingCalendarBlocksKey(listingId),
    payload,
  );
}
