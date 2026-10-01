import { useCallback, useMemo, useState } from "react";
import { BOOKING_EMPTY_COPY } from "../../bookingEmptyCopy";
import { BookingsEmptyCard } from "../../BookingsEmptyCard";
import { CancelBookingModal } from "./cancel/CancelBookingModal";
import { cancelAwaitingPrepaymentBooking } from "./cancel/cancelAwaitingPrepaymentBooking";
import type { AcceptedCancelReason } from "./cancel/parseCancelReason";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import { CONFIRMED_BOOKINGS_MOCK } from "./confirmedBookingsMock";
import type { ConfirmedStatusSortOption } from "./confirmedStatusSortOption";
import { ConfirmedBookingsTable } from "./ConfirmedBookingsTable";
import { ConfirmedStatusSortControl } from "./ConfirmedStatusSortControl";
import { filterConfirmedBookings } from "./filterConfirmedBookings";
import { prioritizeConfirmedBookingsByStatus } from "./prioritizeConfirmedBookingsByStatus";
import { asRequestBooking } from "./request/asRequestBooking";
import { BookingRequestModal } from "./request/BookingRequestModal";
import type { RequestDecision } from "./request/RequestDecision";
import { resolveBookingRequest } from "./request/resolveBookingRequest";

type ConfirmedBookingsPanelProps = {
  query: string;
  forceEmpty: boolean;
};

export function ConfirmedBookingsPanel({
  query,
  forceEmpty,
}: ConfirmedBookingsPanelProps) {
  const [sort, setSort] = useState<ConfirmedStatusSortOption>("all");
  const [bookings, setBookings] =
    useState<readonly ConfirmedBooking[]>(CONFIRMED_BOOKINGS_MOCK);
  const [openedRequestId, setOpenedRequestId] = useState<string | null>(null);

  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const closeRequest = useCallback(() => setOpenedRequestId(null), []);

  const openedRequest = useMemo(() => {
    const opened = bookings.find((item) => item.id === openedRequestId);
    return opened === undefined ? null : asRequestBooking(opened);
  }, [bookings, openedRequestId]);

  function decideRequest(decision: RequestDecision): void {
    if (openedRequestId !== null) {
      setBookings((current) =>
        resolveBookingRequest(current, openedRequestId, decision),
      );
    }
    closeRequest();
  }

  function submitCancellation(reason: AcceptedCancelReason): void {
    if (cancelTargetId !== null) {
      const result = cancelAwaitingPrepaymentBooking(
        bookings,
        cancelTargetId,
        reason,
      );
      setBookings(result.bookings);
    }
    setCancelTargetId(null);
  }

  const visibleItems = useMemo(() => {
    if (forceEmpty) {
      return [];
    }
    const filtered = filterConfirmedBookings(bookings, query);
    const selected = sort === "all" ? [] : [sort];
    return prioritizeConfirmedBookingsByStatus(filtered, selected);
  }, [bookings, forceEmpty, query, sort]);

  if (visibleItems.length === 0) {
    return <BookingsEmptyCard copy={BOOKING_EMPTY_COPY.confirmed} />;
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-auto">
      <div className="flex w-full shrink-0 items-center justify-end">
        <ConfirmedStatusSortControl value={sort} onChange={setSort} />
      </div>
      <ConfirmedBookingsTable
        items={visibleItems}
        onOpenRequest={setOpenedRequestId}
        onCancelBooking={setCancelTargetId}
      />
      <CancelBookingModal
        open={cancelTargetId !== null}
        onClose={() => setCancelTargetId(null)}
        onSubmit={submitCancellation}
      />
      {openedRequest === null ? null : (
        <BookingRequestModal
          booking={openedRequest}
          onClose={closeRequest}
          onDecision={decideRequest}
        />
      )}
    </div>
  );
}
