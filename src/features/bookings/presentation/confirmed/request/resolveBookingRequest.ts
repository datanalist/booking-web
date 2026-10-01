import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ConfirmedBookingId } from "../ConfirmedBookingId";
import type { ConfirmedBookingsTransition } from "../ConfirmedBookingsTransition";
import { asRequestBooking } from "./asRequestBooking";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";
import type { RequestDecision } from "./RequestDecision";
import { REJECTED_REQUEST_DESTINATION } from "./rejectedRequestDestination";

type RequestOutcome =
  | { kind: "stays"; booking: ConfirmedBooking }
  | { kind: "cancelled"; booking: ConfirmedBooking };

/** Drops the request overlay: the row returns to the status it had before the request. */
function restorePreviousStatus(booking: ConfirmedRequestBooking): ConfirmedBooking {
  return { ...booking, status: booking.status.previousStatus };
}

function reject(booking: ConfirmedRequestBooking): RequestOutcome {
  switch (REJECTED_REQUEST_DESTINATION) {
    case "restorePreviousStatus":
      return { kind: "stays", booking: restorePreviousStatus(booking) };
    case "moveToCancelled":
      return { kind: "cancelled", booking };
  }
}

function accept(booking: ConfirmedRequestBooking): RequestOutcome {
  const { request } = booking.status;
  switch (request.kind) {
    case "cancel":
      return { kind: "cancelled", booking };
    case "changeDates":
      return {
        kind: "stays",
        booking: {
          ...restorePreviousStatus(booking),
          stay: request.proposedStay,
          priceLabel: request.proposedPriceLabel,
        },
      };
  }
}

function applyDecision(
  booking: ConfirmedRequestBooking,
  decision: RequestDecision,
): RequestOutcome {
  switch (decision) {
    case "accept":
      return accept(booking);
    case "reject":
      return reject(booking);
  }
}

/** Applies the owner's decision to the request booking with `bookingId`; other rows are untouched. */
export function resolveBookingRequest(
  bookings: readonly ConfirmedBooking[],
  bookingId: ConfirmedBookingId,
  decision: RequestDecision,
): ConfirmedBookingsTransition {
  const confirmed: ConfirmedBooking[] = [];
  const cancelled: ConfirmedBooking[] = [];
  for (const booking of bookings) {
    const requestBooking =
      booking.id === bookingId ? asRequestBooking(booking) : null;
    if (requestBooking === null) {
      confirmed.push(booking);
      continue;
    }
    const outcome = applyDecision(requestBooking, decision);
    (outcome.kind === "stays" ? confirmed : cancelled).push(outcome.booking);
  }
  return { confirmed, cancelled };
}
