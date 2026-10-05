import { matchesGuestQuery } from "../../matchesGuestQuery";
import type { ConfirmedBooking } from "./ConfirmedBooking";

export function filterConfirmedBookings(
  items: readonly ConfirmedBooking[],
  query: string,
): ConfirmedBooking[] {
  return items.filter((item) =>
    matchesGuestQuery(item.guestName, item.guestPhone, query),
  );
}
