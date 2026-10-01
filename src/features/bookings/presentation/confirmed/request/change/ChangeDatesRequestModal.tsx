import { BookingRequestModalFrame } from "../BookingRequestModalFrame";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";
import type { RequestDecision } from "../RequestDecision";
import { ChangeDatesCurrentSection } from "./ChangeDatesCurrentSection";
import { changeDatesProposal } from "./ChangeDatesProposal";
import { ChangeDatesProposedSection } from "./ChangeDatesProposedSection";

type ChangeDatesRequestModalProps = {
  booking: ConfirmedRequestBooking;
  onClose: () => void;
  onDecision: (decision: RequestDecision) => void;
};

export function ChangeDatesRequestModal({
  booking,
  onClose,
  onDecision,
}: ChangeDatesRequestModalProps) {
  const proposal = changeDatesProposal(booking);
  return (
    <BookingRequestModalFrame
      title="Запрос на изменение сроков бронирования"
      description="Клиент получит уведомление с вашим решением об изменении сроков бронирования"
      booking={booking}
      onClose={onClose}
      onDecision={onDecision}
    >
      {proposal === null ? null : (
        <>
          <ChangeDatesCurrentSection booking={booking} />
          <ChangeDatesProposedSection proposal={proposal} />
        </>
      )}
    </BookingRequestModalFrame>
  );
}
