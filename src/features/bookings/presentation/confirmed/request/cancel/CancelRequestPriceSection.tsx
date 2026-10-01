import { BookingRequestSection } from "../BookingRequestSection";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";

type CancelRequestPriceSectionProps = {
  booking: ConfirmedRequestBooking;
};

/** Price of the booking the guest asks to cancel. */
export function CancelRequestPriceSection({
  booking,
}: CancelRequestPriceSectionProps) {
  return (
    <BookingRequestSection title="Стоимость">
      <p className="m-0 text-base leading-6 text-absolute-black">
        {booking.priceLabel}
      </p>
    </BookingRequestSection>
  );
}
