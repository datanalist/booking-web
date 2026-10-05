import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ConfirmedBookingsTransition } from "../ConfirmedBookingsTransition";
import { canShowCancelBookingMenu } from "./canShowCancelBookingMenu";
import type { AcceptedCancelReason } from "./parseCancelReason";

export type CancelAwaitingPrepaymentResult =
  | {
      readonly outcome: "cancelled";
      readonly transition: ConfirmedBookingsTransition;
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
    transition: {
      confirmed: bookings.filter((item) => item.id !== bookingId),
      cancelled: [target],
    },
    reason,
  };
}
