import { isBookingTabId, type BookingTabId } from "./bookingTabId";

export function parseBookingsTabParam(value: string | null): BookingTabId {
  if (isBookingTabId(value)) {
    return value;
  }
  return "requests";
}
