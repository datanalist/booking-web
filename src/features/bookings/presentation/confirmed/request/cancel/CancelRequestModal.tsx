import { BookingRequestModalFrame } from "../BookingRequestModalFrame";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";
import type { RequestDecision } from "../RequestDecision";

type CancelRequestModalProps = {
  booking: ConfirmedRequestBooking;
  onClose: () => void;
  onDecision: (decision: RequestDecision) => void;
};

/** Stub: sections "Даты" and "Стоимость" are added by the feat-bookings-request-cancel branch. */
export function CancelRequestModal({
  booking,
  onClose,
  onDecision,
}: CancelRequestModalProps) {
  return (
    <BookingRequestModalFrame
      title="Запрос на отмену бронирования"
      description="Клиент получит уведомление с вашим решением об отмене бронирования"
      booking={booking}
      onClose={onClose}
      onDecision={onDecision}
    />
  );
}
