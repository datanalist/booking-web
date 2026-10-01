import { BookingRequestSection } from "../BookingRequestSection";
import { BookingRequestValuesRow } from "../BookingRequestValuesRow";
import { formatNights } from "../../stay/formatNights";
import { formatStayLong } from "../../stay/formatStayLong";
import { stayNights } from "../../stay/stayNights";
import type { ChangeDatesProposal } from "./ChangeDatesProposal";

type ChangeDatesProposedSectionProps = {
  proposal: ChangeDatesProposal;
};

export function ChangeDatesProposedSection({
  proposal,
}: ChangeDatesProposedSectionProps) {
  return (
    <BookingRequestSection title="Новые сроки бронирования">
      <BookingRequestValuesRow
        values={[
          formatStayLong(proposal.proposedStay),
          formatNights(stayNights(proposal.proposedStay)),
          proposal.proposedPriceLabel,
        ]}
      />
    </BookingRequestSection>
  );
}
