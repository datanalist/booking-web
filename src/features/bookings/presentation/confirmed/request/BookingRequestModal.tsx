import { CancelRequestModal } from "./cancel/CancelRequestModal";
import { ChangeDatesRequestModal } from "./change/ChangeDatesRequestModal";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";
import type { RequestDecision } from "./RequestDecision";

type BookingRequestModalProps = {
  booking: ConfirmedRequestBooking;
  onClose: () => void;
  onDecision: (decision: RequestDecision) => void;
};

/** Dispatches to the modal matching the kind of the booking request. */
export function BookingRequestModal({
  booking,
  onClose,
  onDecision,
}: BookingRequestModalProps) {
  switch (booking.status.request.kind) {
    case "cancel":
      return (
        <CancelRequestModal
          booking={booking}
          onClose={onClose}
          onDecision={onDecision}
        />
      );
    case "changeDates":
      return (
        <ChangeDatesRequestModal
          booking={booking}
          onClose={onClose}
          onDecision={onDecision}
        />
      );
  }
}
