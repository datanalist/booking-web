import type { ConfirmedBookingId } from "../ConfirmedBookingId";

/** The modal currently opened from a row's «три точки» menu; only one can be open. */
export type ConfirmedBookingDialog =
  | { kind: "request"; bookingId: ConfirmedBookingId }
  | { kind: "cancel"; bookingId: ConfirmedBookingId }
  | { kind: "review"; bookingId: ConfirmedBookingId };
