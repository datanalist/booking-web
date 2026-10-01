import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ConfirmedBookingStatus } from "../confirmedBookingStatus";

/** A confirmed booking whose status is "Запрос" (the request payload is guaranteed present). */
export type ConfirmedRequestBooking = Omit<ConfirmedBooking, "status"> & {
  status: Extract<ConfirmedBookingStatus, { kind: "request" }>;
};
