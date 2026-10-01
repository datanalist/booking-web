import { MoreVertical } from "lucide-react";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import { ConfirmedBookingChatIcon } from "./ConfirmedBookingChatIcon";
import { ConfirmedStatusCell } from "./ConfirmedStatusCell";
import { StayCompletedReviewMenu } from "./review/StayCompletedReviewMenu";

type ConfirmedBookingRowProps = {
  booking: ConfirmedBooking;
};

export function ConfirmedBookingRow({ booking }: ConfirmedBookingRowProps) {
  return (
    <div
      role="row"
      className="grid h-28 grid-cols-[14rem_4rem_18rem_9rem_7rem_minmax(0,1fr)_3.5rem] items-center border-b border-amber-400/20 bg-white last:border-b-0"
    >
      <div role="cell" className="flex h-full items-center gap-3 px-5">
        <img
          src={booking.guestAvatarUrl}
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

      <div role="cell" className="flex h-full items-center gap-3 px-5">
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
        {booking.datesLabel}
      </div>

      <div
        role="cell"
        className="flex h-full items-center px-5 text-sm leading-5 text-[var(--color-ink)]"
      >
        {booking.priceLabel}
      </div>

      <div role="cell" className="flex h-full items-center px-5 py-2.5">
        <ConfirmedStatusCell status={booking.status} />
      </div>

      <div
        role="cell"
        className="flex h-full items-center justify-center px-5 py-2.5"
      >
        {booking.status.kind === "stayCompleted" ? (
          <StayCompletedReviewMenu booking={booking} />
        ) : (
          <button
            type="button"
            aria-label="Меню бронирования"
            disabled
            className="inline-flex size-6 cursor-not-allowed items-center justify-center border-0 bg-transparent p-0 text-[var(--color-ink)] opacity-50"
          >
            <MoreVertical aria-hidden className="size-5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
