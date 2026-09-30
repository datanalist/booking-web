import { formatRub } from "../../../../lib/money";
import type { CancelledBooking } from "./CancelledBooking";
import { CancelledBookingChatIcon } from "./CancelledBookingChatIcon";

type CancelledBookingRowProps = {
  booking: CancelledBooking;
};

export function CancelledBookingRow({ booking }: CancelledBookingRowProps) {
  return (
    <tr className="h-[112px] border-b border-[#f0e6d8] bg-white last:border-b-0">
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-bold leading-[1.3] text-[var(--color-ink)]">
            {booking.guestName}
          </span>
          <span className="text-[14px] leading-[1.4] text-[#525353]">
            {booking.guestPhone}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <CancelledBookingChatIcon />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-bold leading-[1.3] text-[var(--color-ink)]">
            {booking.housingTitle}
          </span>
          <span className="text-[14px] leading-[1.4] text-[#525353]">
            {booking.housingAddress}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-[16px] text-[var(--color-ink)]">
        {booking.datesLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-[16px] font-bold text-[var(--color-ink)]">
        {formatRub(booking.price)}
      </td>
    </tr>
  );
}
