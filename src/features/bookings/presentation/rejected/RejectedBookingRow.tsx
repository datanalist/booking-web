import { Mail } from "lucide-react";
import { useVisibleAccountPhoto } from "../../../../ui/useAccountPhotoSrc";
import type { RejectedBooking } from "../../domain/RejectedBooking";

type RejectedBookingRowProps = {
  booking: RejectedBooking;
};

export function RejectedBookingRow({ booking }: RejectedBookingRowProps) {
  const guestAvatarSrc = useVisibleAccountPhoto(booking.guestAvatarUrl);
  return (
    <div
      role="row"
      className="flex h-28 items-center border-b border-amber-400/20 bg-white"
    >
      <div role="cell" className="flex w-56 items-center gap-3 px-5">
        <img
          src={guestAvatarSrc}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-normal leading-5 text-[var(--color-ink)]">
            {booking.guestName}
          </span>
          <span className="truncate text-xs font-normal leading-4 text-neutral-600">
            {booking.guestPhone}
          </span>
        </div>
      </div>

      <div role="cell" className="flex w-16 items-center justify-center px-2">
        <span
          aria-label={`Чат с ${booking.guestName}`}
          className="inline-flex size-6 items-center justify-center text-black"
        >
          <Mail className="size-6" strokeWidth={1.5} aria-hidden />
        </span>
      </div>

      <div role="cell" className="flex w-72 items-center gap-3 px-5">
        <img
          src={booking.listingPhotoUrl}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-lg object-cover p-1"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-normal leading-5 text-[var(--color-ink)]">
            {booking.listingTitle}
          </span>
          <span className="truncate text-xs font-normal leading-4 text-neutral-600">
            {booking.listingAddress}
          </span>
        </div>
      </div>

      <div
        role="cell"
        className="flex w-36 items-center px-5 text-sm leading-5 text-[var(--color-ink)]"
      >
        {booking.datesLabel}
      </div>

      <div
        role="cell"
        className="flex w-28 items-center px-5 text-sm leading-5 text-[var(--color-ink)]"
      >
        {booking.priceLabel}
      </div>
    </div>
  );
}
