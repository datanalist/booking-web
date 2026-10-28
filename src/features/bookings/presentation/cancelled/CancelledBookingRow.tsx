import { formatRub } from "../../../../lib/money";
import { useVisibleAccountPhoto } from "../../../../ui/useAccountPhotoSrc";
import type { CancelledBooking } from "./CancelledBooking";
import { CancelledBookingChatIcon } from "./CancelledBookingChatIcon";

type CancelledBookingRowProps = {
  booking: CancelledBooking;
};

export function CancelledBookingRow({ booking }: CancelledBookingRowProps) {
  const guestAvatarSrc = useVisibleAccountPhoto(booking.guestAvatarUrl);
  return (
    <tr className="h-28 border-b border-amber-400/20 bg-white last:border-b-0">
      <td className="w-56 px-5 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={guestAvatarSrc}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-normal leading-5 text-black">
              {booking.guestName}
            </span>
            <span className="truncate text-xs font-normal leading-4 text-neutral-600">
              {booking.guestPhone}
            </span>
          </div>
        </div>
      </td>
      <td className="w-16 px-5 align-middle">
        <CancelledBookingChatIcon />
      </td>
      <td className="w-72 px-5 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={booking.housingPhotoUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-lg object-cover p-1"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-normal leading-5 text-black">
              {booking.housingTitle}
            </span>
            <span className="truncate text-xs font-normal leading-4 text-neutral-600">
              {booking.housingAddress}
            </span>
          </div>
        </div>
      </td>
      <td className="w-36 whitespace-nowrap px-5 align-middle text-sm font-normal leading-5 text-black">
        {booking.datesLabel}
      </td>
      <td className="w-28 whitespace-nowrap px-5 align-middle text-sm font-normal leading-5 text-black">
        {formatRub(booking.price)}
      </td>
    </tr>
  );
}
