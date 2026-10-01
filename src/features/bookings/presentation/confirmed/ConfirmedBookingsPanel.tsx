import { useMemo, useState } from "react";
import { BOOKING_EMPTY_COPY } from "../../bookingEmptyCopy";
import { BookingsEmptyCard } from "../../BookingsEmptyCard";
import {
  cancelAwaitingPrepaymentBooking,
  type CancelConfirmedBooking,
} from "./cancel/cancelAwaitingPrepaymentBooking";
import type { AcceptedCancelReason } from "./cancel/parseCancelReason";
import { CONFIRMED_BOOKINGS_MOCK } from "./confirmedBookingsMock";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import type { ConfirmedStatusSortOption } from "./confirmedStatusSortOption";
import { ConfirmedBookingsTable } from "./ConfirmedBookingsTable";
import { ConfirmedStatusSortControl } from "./ConfirmedStatusSortControl";
import { filterConfirmedBookings } from "./filterConfirmedBookings";
import { prioritizeConfirmedBookingsByStatus } from "./prioritizeConfirmedBookingsByStatus";

type ConfirmedBookingsPanelProps = {
  query: string;
  forceEmpty: boolean;
};

export function ConfirmedBookingsPanel({
  query,
  forceEmpty,
}: ConfirmedBookingsPanelProps) {
  const [sort, setSort] = useState<ConfirmedStatusSortOption>("all");
  const [bookings, setBookings] = useState<readonly ConfirmedBooking[]>(
    () => CONFIRMED_BOOKINGS_MOCK,
  );

  const visibleItems = useMemo(() => {
    if (forceEmpty) {
      return [];
    }
    const filtered = filterConfirmedBookings(bookings, query);
    const selected = sort === "all" ? [] : [sort];
    return prioritizeConfirmedBookingsByStatus(filtered, selected);
  }, [bookings, forceEmpty, query, sort]);

  const handleCancel: CancelConfirmedBooking = (bookingId, reason) => {
    setBookings((current) => applyCancellation(current, bookingId, reason));
  };

  if (visibleItems.length === 0) {
    return <BookingsEmptyCard copy={BOOKING_EMPTY_COPY.confirmed} />;
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-auto">
      <div className="flex w-full shrink-0 items-center justify-end">
        <ConfirmedStatusSortControl value={sort} onChange={setSort} />
      </div>
      <ConfirmedBookingsTable items={visibleItems} onCancel={handleCancel} />
    </div>
  );
}

function applyCancellation(
  bookings: readonly ConfirmedBooking[],
  bookingId: ConfirmedBooking["id"],
  reason: AcceptedCancelReason,
): readonly ConfirmedBooking[] {
  const result = cancelAwaitingPrepaymentBooking(bookings, bookingId, reason);
  switch (result.outcome) {
    case "cancelled":
      return result.bookings;
    case "unchanged":
      return bookings;
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}
