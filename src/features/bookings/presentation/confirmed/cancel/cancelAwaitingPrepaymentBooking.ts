import type { ConfirmedBooking } from "../ConfirmedBooking";
import { canShowCancelBookingMenu } from "./canShowCancelBookingMenu";
import type { AcceptedCancelReason } from "./parseCancelReason";

export type CancelConfirmedBooking = (
  bookingId: ConfirmedBooking["id"],
  reason: AcceptedCancelReason,
) => void;

export type CancelAwaitingPrepaymentResult =
  | {
      readonly outcome: "cancelled";
      readonly bookings: readonly ConfirmedBooking[];
      readonly reason: AcceptedCancelReason;
    }
  | {
      readonly outcome: "unchanged";
      readonly bookings: readonly ConfirmedBooking[];
    };

export function cancelAwaitingPrepaymentBooking(
  bookings: readonly ConfirmedBooking[],
  bookingId: ConfirmedBooking["id"],
  reason: AcceptedCancelReason,
): CancelAwaitingPrepaymentResult {
  const target = bookings.find((item) => item.id === bookingId);
  if (!target || !canShowCancelBookingMenu(target.status)) {
    return { outcome: "unchanged", bookings };
  }

  return {
    outcome: "cancelled",
    bookings: bookings.filter((item) => item.id !== bookingId),
    reason,
  };
}
