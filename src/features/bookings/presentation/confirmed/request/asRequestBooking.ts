import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";

export function asRequestBooking(
  booking: ConfirmedBooking,
): ConfirmedRequestBooking | null {
  const { status } = booking;
  if (status.kind !== "request") {
    return null;
  }
  return { ...booking, status };
}
