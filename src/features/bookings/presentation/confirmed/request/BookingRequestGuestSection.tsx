import { useVisibleAccountPhoto } from "../../../../../ui/useAccountPhotoSrc";
import { BookingRequestSection } from "./BookingRequestSection";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";

type BookingRequestGuestSectionProps = {
  booking: ConfirmedRequestBooking;
};

export function BookingRequestGuestSection({
  booking,
}: BookingRequestGuestSectionProps) {
  const guestAvatarSrc = useVisibleAccountPhoto(booking.guestAvatarUrl);
  return (
    <BookingRequestSection title="Клиент">
      <div className="flex items-center gap-3">
        <img
          src={guestAvatarSrc}
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
