import type { ConfirmedBooking } from "../ConfirmedBooking";
import { CancelBookingModal } from "../cancel/CancelBookingModal";
import type { AcceptedCancelReason } from "../cancel/parseCancelReason";
import { asRequestBooking } from "../request/asRequestBooking";
import { BookingRequestModal } from "../request/BookingRequestModal";
import type { RequestDecision } from "../request/RequestDecision";
import type { BookingReview } from "../review/BookingReview";
import { ReviewModal } from "../review/ReviewModal";
import type { ConfirmedBookingDialog } from "./ConfirmedBookingDialog";

type ConfirmedBookingDialogHostProps = {
  dialog: ConfirmedBookingDialog | null;
  bookings: readonly ConfirmedBooking[];
  onClose: () => void;
  onDecideRequest: (bookingId: ConfirmedBooking["id"], decision: RequestDecision) => void;
  onSubmitCancel: (bookingId: ConfirmedBooking["id"], reason: AcceptedCancelReason) => void;
  onSubmitReview: (review: BookingReview) => void;
};

/** Renders the modal for `dialog`; each modal lives in its own folder (request/, cancel/, review/). */
export function ConfirmedBookingDialogHost({
  dialog,
  bookings,
  onClose,
  onDecideRequest,
  onSubmitCancel,
  onSubmitReview,
}: ConfirmedBookingDialogHostProps) {
  if (dialog === null) {
    return null;
  }
  const booking = bookings.find((item) => item.id === dialog.bookingId);
  if (booking === undefined) {
    return null;
  }
  switch (dialog.kind) {
    case "request": {
      const requestBooking = asRequestBooking(booking);
      return requestBooking === null ? null : (
        <BookingRequestModal
          booking={requestBooking}
          onClose={onClose}
          onDecision={(decision) => onDecideRequest(booking.id, decision)}
        />
      );
    }
    case "cancel":
      return (
        <CancelBookingModal
          onClose={onClose}
          onSubmit={(reason) => onSubmitCancel(booking.id, reason)}
        />
      );
    case "review":
      return (
        <ReviewModal
          booking={booking}
          onClose={onClose}
          onSubmit={onSubmitReview}
        />
      );
  }
}
