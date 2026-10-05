import { BookingRequestSection } from "./BookingRequestSection";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";

type BookingRequestHousingSectionProps = {
  booking: ConfirmedRequestBooking;
};

export function BookingRequestHousingSection({
  booking,
}: BookingRequestHousingSectionProps) {
  return (
    <BookingRequestSection title="Жилье">
      <div className="flex items-center gap-3">
        <div className="size-12 shrink-0 rounded-lg p-1">
          <img
            src={booking.housingPhotoUrl}
            alt=""
            className="size-full rounded-lg object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-base leading-6 text-absolute-black">
            {booking.housingTitle}
          </span>
          <span className="text-sm leading-5 text-neutral-600">
            {booking.housingAddress}
          </span>
        </div>
      </div>
    </BookingRequestSection>
  );
}
