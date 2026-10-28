import { useVisibleAccountPhoto } from "../../../../ui/useAccountPhotoSrc";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import { CONFIRMED_BOOKINGS_GRID_CLASS } from "./confirmedBookingsGrid";
import { ConfirmedBookingMenu } from "./menu/ConfirmedBookingMenu";
import type { ConfirmedBookingRowActions } from "./menu/ConfirmedBookingRowActions";
import { ConfirmedBookingChatIcon } from "./ConfirmedBookingChatIcon";
import { ConfirmedStatusCell } from "./ConfirmedStatusCell";
import { formatStayTable } from "./stay/formatStayTable";

type ConfirmedBookingRowProps = {
  booking: ConfirmedBooking;
  actions: ConfirmedBookingRowActions;
};

export function ConfirmedBookingRow({
  booking,
  actions,
}: ConfirmedBookingRowProps) {
  const guestAvatarSrc = useVisibleAccountPhoto(booking.guestAvatarUrl);
  return (
    <div
      role="row"
      className={`grid h-28 ${CONFIRMED_BOOKINGS_GRID_CLASS} items-center border-b border-amber-400/20 bg-white last:border-b-0`}
    >
      <div role="cell" className="flex h-full min-w-0 items-center gap-3 px-5">
        <img
          src={guestAvatarSrc}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm leading-5 text-[var(--color-ink)]">
            {booking.guestName}
          </span>
          <span className="truncate text-xs leading-4 text-[#525353]">
            {booking.guestPhone}
          </span>
        </div>
      </div>

      <div role="cell" className="flex h-full w-16 items-center px-5">
        <ConfirmedBookingChatIcon guestName={booking.guestName} />
      </div>

      <div role="cell" className="flex h-full min-w-0 items-center gap-3 px-5">
        <img
          src={booking.housingPhotoUrl}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm leading-5 text-[var(--color-ink)]">
            {booking.housingTitle}
          </span>
          <span className="truncate text-xs leading-4 text-[#525353]">
            {booking.housingAddress}
          </span>
        </div>
      </div>

      <div
        role="cell"
        className="flex h-full items-center px-5 text-sm leading-5 text-[var(--color-ink)]"
      >
        {formatStayTable(booking.stay)}
      </div>

      <div
        role="cell"
        className="flex h-full items-center px-5 text-sm leading-5 text-[var(--color-ink)]"
      >
        {booking.priceLabel}
      </div>

      <div role="cell" className="flex h-full min-w-max items-center px-5 py-2.5">
        <ConfirmedStatusCell status={booking.status} />
      </div>

      <div role="cell" className="flex h-full items-center justify-center">
        <ConfirmedBookingMenu booking={booking} actions={actions} />
      </div>
    </div>
  );
}
