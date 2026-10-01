import { BookingRequestModalFrame } from "../BookingRequestModalFrame";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";
import type { RequestDecision } from "../RequestDecision";

type ChangeDatesRequestModalProps = {
  booking: ConfirmedRequestBooking;
  onClose: () => void;
  onDecision: (decision: RequestDecision) => void;
};

/** Stub: "Текущиие/Новые сроки бронирования" sections are added by the feat-bookings-request-change branch. */
export function ChangeDatesRequestModal({
  booking,
  onClose,
  onDecision,
}: ChangeDatesRequestModalProps) {
  return (
    <BookingRequestModalFrame
      title="Запрос на изменение сроков бронирования"
      description="Клиент получит уведомление с вашим решением об изменении сроков бронирования"
      booking={booking}
      onClose={onClose}
      onDecision={onDecision}
    />
  );
}
