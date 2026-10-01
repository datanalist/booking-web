import type { BookingStay } from "../../stay/BookingStay";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";

/** New terms proposed by the guest in a change-dates request. */
export type ChangeDatesProposal = {
  proposedStay: BookingStay;
  proposedPriceLabel: string;
};

/** Extracts the proposal; null when the request is of another kind. */
export function changeDatesProposal(
  booking: ConfirmedRequestBooking,
): ChangeDatesProposal | null {
  const { request } = booking.status;
  switch (request.kind) {
    case "changeDates":
      return {
        proposedStay: request.proposedStay,
        proposedPriceLabel: request.proposedPriceLabel,
      };
    case "cancel":
      return null;
  }
}
