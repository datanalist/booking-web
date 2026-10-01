import type { ConfirmedBooking } from "../ConfirmedBooking";

/** The modal currently opened from a row's «три точки» menu; only one can be open. */
export type ConfirmedBookingDialog =
  | { kind: "request"; bookingId: ConfirmedBooking["id"] }
  | { kind: "cancel"; bookingId: ConfirmedBooking["id"] }
  | { kind: "review"; bookingId: ConfirmedBooking["id"] };
