import { matchesGuestQuery } from "../../matchesGuestQuery";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import type { ConfirmedStatusSortOption } from "./confirmedStatusSortOption";

export function filterConfirmedBookings(
  items: readonly ConfirmedBooking[],
  query: string,
  sort: ConfirmedStatusSortOption,
): ConfirmedBooking[] {
  return items.filter((item) => {
    if (!matchesGuestQuery(item.guestName, item.guestPhone, query)) {
      return false;
    }
    if (sort === "all") {
      return true;
    }
    return item.status.kind === sort;
  });
}
