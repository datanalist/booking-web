import {
  emptyBookingDayOverrides,
  type BookingDayOverrides,
} from "./BookingDayOverrides";
import { bookingCalendarBlocksKey } from "./bookingCalendarBlocksKey";
import { parseBookingDayOverrides } from "./parseBookingDayOverrides";

/** Читает блокировки объявления. Пустой ключ и битый JSON дают пустой набор. */
export function readBookingDayOverrides(
  storage: Storage,
  listingId: string,
): BookingDayOverrides {
  const raw = storage.getItem(bookingCalendarBlocksKey(listingId));
  if (raw === null) {
    return emptyBookingDayOverrides();
  }
  return parseBookingDayOverrides(raw);
}
