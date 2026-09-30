import { Mail } from "lucide-react";
import type { RejectedBooking } from "../../domain/RejectedBooking";

type RejectedBookingRowProps = {
  booking: RejectedBooking;
};

export function RejectedBookingRow({ booking }: RejectedBookingRowProps) {
  return (
    <tr className="h-[112px] border-b border-[rgba(26,27,29,0.08)]">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={booking.guestAvatarUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
              {booking.guestName}
            </span>
            <span className="truncate text-[14px] leading-[1.4] text-[#525353]">
              {booking.guestPhone}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span
          aria-label={`Чат с ${booking.guestName}`}
          className="inline-flex size-10 items-center justify-center rounded-lg text-[var(--color-accent)]"
        >
          <Mail className="size-5" aria-hidden />
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={booking.listingPhotoUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-lg object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
              {booking.listingTitle}
            </span>
            <span className="truncate text-[14px] leading-[1.4] text-[#525353]">
              {booking.listingAddress}
            </span>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-[16px] text-[var(--color-ink)]">
        {booking.datesLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-[16px] font-bold text-[var(--color-ink)]">
        {booking.priceLabel}
      </td>
    </tr>
  );
}
