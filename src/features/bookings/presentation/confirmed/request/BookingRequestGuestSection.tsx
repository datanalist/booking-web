import { BookingRequestSection } from "./BookingRequestSection";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";

type BookingRequestGuestSectionProps = {
  booking: ConfirmedRequestBooking;
};

export function BookingRequestGuestSection({
  booking,
}: BookingRequestGuestSectionProps) {
  return (
    <BookingRequestSection title="Клиент">
      <div className="flex items-center gap-3">
        <img
          src={booking.guestAvatarUrl}
          alt=""
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col">
          <span className="text-base leading-6 text-absolute-black">
            {booking.guestName}
          </span>
          <span className="text-sm leading-5 text-neutral-600">
            {booking.guestPhone}
          </span>
        </div>
      </div>
    </BookingRequestSection>
  );
}
