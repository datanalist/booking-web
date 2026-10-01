import type { ConfirmedBooking } from "../ConfirmedBooking";
import { asRequestBooking } from "./asRequestBooking";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";
import type { RequestDecision } from "./RequestDecision";

/** After a request is resolved the row keeps a confirmed booking with paid prepayment. */
function withoutRequest(booking: ConfirmedRequestBooking): ConfirmedBooking {
  return { ...booking, status: { kind: "prepaymentPaid" } };
}

function applyDecision(
  booking: ConfirmedRequestBooking,
  decision: RequestDecision,
): ConfirmedBooking | null {
  const { request } = booking.status;
  switch (request.kind) {
    case "cancel":
      // Accepted cancellation removes the booking from "Подтверждены".
      return decision === "accept" ? null : withoutRequest(booking);
    case "changeDates":
      return decision === "accept"
        ? {
            ...withoutRequest(booking),
            stay: request.proposedStay,
            priceLabel: request.proposedPriceLabel,
          }
        : withoutRequest(booking);
  }
}

/** Applies the owner's decision to the request booking with `bookingId`; other rows are untouched. */
export function resolveBookingRequest(
  bookings: readonly ConfirmedBooking[],
  bookingId: string,
  decision: RequestDecision,
): ConfirmedBooking[] {
  return bookings.flatMap((booking) => {
    if (booking.id !== bookingId) {
      return [booking];
    }
    const requestBooking = asRequestBooking(booking);
    if (requestBooking === null) {
      return [booking];
    }
    const resolved = applyDecision(requestBooking, decision);
    return resolved === null ? [] : [resolved];
  });
}
