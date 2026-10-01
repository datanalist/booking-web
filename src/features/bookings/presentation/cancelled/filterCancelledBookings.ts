import { matchesGuestQuery } from "../../matchesGuestQuery";
import type { CancelledBooking } from "./CancelledBooking";

export function filterCancelledBookings(
  items: readonly CancelledBooking[],
  query: string,
): CancelledBooking[] {
  return items.filter((item) =>
    matchesGuestQuery(item.guestName, item.guestPhone, query),
  );
}
