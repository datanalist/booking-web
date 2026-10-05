import { BookingRequestModalFrame } from "../BookingRequestModalFrame";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";
import type { RequestDecision } from "../RequestDecision";
import { CancelRequestDatesSection } from "./CancelRequestDatesSection";
import { CancelRequestPriceSection } from "./CancelRequestPriceSection";

type CancelRequestModalProps = {
  booking: ConfirmedRequestBooking;
  onClose: () => void;
  onDecision: (decision: RequestDecision) => void;
};

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
    >
      <CancelRequestDatesSection booking={booking} />
      <CancelRequestPriceSection booking={booking} />
    </BookingRequestModalFrame>
  );
}
