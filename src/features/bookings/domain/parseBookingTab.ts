import {
  BOOKING_TABS,
  DEFAULT_BOOKING_TAB,
  type BookingTabId,
} from "./BookingTabId";

export function isBookingTabId(value: string): value is BookingTabId {
  return BOOKING_TABS.some((tab) => tab.id === value);
}

export function parseBookingTab(value: string | null): BookingTabId {
  if (value !== null && isBookingTabId(value)) {
    return value;
  }
  return DEFAULT_BOOKING_TAB;
}
