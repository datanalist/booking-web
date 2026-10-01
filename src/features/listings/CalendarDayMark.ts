import type { BookingCalendarGuestTone } from "./bookingCalendarDemo";

/** Визуальное состояние дня по легенде календаря. */
export type CalendarDayMark =
  | { readonly kind: "available" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "booked"; readonly tone: BookingCalendarGuestTone };
