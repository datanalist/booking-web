import type { ConfirmedBooking } from "./ConfirmedBooking";

/** Result of an action on «Подтверждены»: the new list and the bookings that left it as cancelled. */
export type ConfirmedBookingsTransition = {
  confirmed: readonly ConfirmedBooking[];
  /** Written to the «Отменены» tab; empty when nothing was cancelled. */
  cancelled: readonly ConfirmedBooking[];
};
