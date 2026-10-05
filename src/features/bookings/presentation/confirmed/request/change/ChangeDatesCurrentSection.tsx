import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";
import { BookingRequestSection } from "../BookingRequestSection";
import { BookingRequestValuesRow } from "../BookingRequestValuesRow";
import { formatNights } from "../../stay/formatNights";
import { formatStayLong } from "../../stay/formatStayLong";
import { stayNights } from "../../stay/stayNights";

type ChangeDatesCurrentSectionProps = {
  booking: ConfirmedRequestBooking;
};

/** Heading text is kept verbatim from the design mock (including the doubled "и"). */
export function ChangeDatesCurrentSection({
  booking,
}: ChangeDatesCurrentSectionProps) {
  return (
    <BookingRequestSection title="Текущие сроки бронирования">
      <BookingRequestValuesRow
        values={[
          formatStayLong(booking.stay),
          formatNights(stayNights(booking.stay)),
          booking.priceLabel,
        ]}
      />
    </BookingRequestSection>
  );
}
