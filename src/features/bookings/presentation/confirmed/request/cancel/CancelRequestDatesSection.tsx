import { formatNights } from "../../stay/formatNights";
import { formatStayLong } from "../../stay/formatStayLong";
import { stayNights } from "../../stay/stayNights";
import { BookingRequestSection } from "../BookingRequestSection";
import { BookingRequestValuesRow } from "../BookingRequestValuesRow";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";

type CancelRequestDatesSectionProps = {
  booking: ConfirmedRequestBooking;
};

/** Stay range and night count of the cancellation request. */
export function CancelRequestDatesSection({
  booking,
}: CancelRequestDatesSectionProps) {
  return (
    <BookingRequestSection title="Даты">
      <BookingRequestValuesRow
        values={[
          formatStayLong(booking.stay),
          formatNights(stayNights(booking.stay)),
        ]}
      />
    </BookingRequestSection>
  );
}
