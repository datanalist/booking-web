import { useMemo, useState } from "react";
import { BOOKING_EMPTY_COPY } from "../../bookingEmptyCopy";
import { BookingsEmptyCard } from "../../BookingsEmptyCard";
import { cancelAwaitingPrepaymentBooking } from "./cancel/cancelAwaitingPrepaymentBooking";
import type { AcceptedCancelReason } from "./cancel/parseCancelReason";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import { CONFIRMED_BOOKINGS_MOCK } from "./confirmedBookingsMock";
import type { ConfirmedStatusSortOption } from "./confirmedStatusSortOption";
import { ConfirmedBookingsTable } from "./ConfirmedBookingsTable";
import { ConfirmedStatusSortControl } from "./ConfirmedStatusSortControl";
import type { ConfirmedBookingDialog } from "./dialog/ConfirmedBookingDialog";
import { ConfirmedBookingDialogHost } from "./dialog/ConfirmedBookingDialogHost";
import { filterConfirmedBookings } from "./filterConfirmedBookings";
import { prioritizeConfirmedBookingsByStatus } from "./prioritizeConfirmedBookingsByStatus";
import type { RequestDecision } from "./request/RequestDecision";
import { resolveBookingRequest } from "./request/resolveBookingRequest";
import type { BookingReview } from "./review/BookingReview";
import { bookingReviewsStore } from "./review/bookingReviewsStore";

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
  const [dialog, setDialog] = useState<ConfirmedBookingDialog | null>(null);

  const closeDialog = (): void => setDialog(null);

  function decideRequest(
    bookingId: ConfirmedBooking["id"],
    decision: RequestDecision,
  ): void {
    setBookings((current) => resolveBookingRequest(current, bookingId, decision));
    closeDialog();
  }

  function submitCancellation(
    bookingId: ConfirmedBooking["id"],
    reason: AcceptedCancelReason,
  ): void {
    setBookings(
      (current) =>
        cancelAwaitingPrepaymentBooking(current, bookingId, reason).bookings,
    );
    closeDialog();
  }

  function submitReview(review: BookingReview): void {
    bookingReviewsStore.save(review);
    closeDialog();
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
      <ConfirmedBookingsTable items={visibleItems} onOpenDialog={setDialog} />
      <ConfirmedBookingDialogHost
        dialog={dialog}
        bookings={bookings}
        onClose={closeDialog}
        onDecideRequest={decideRequest}
        onSubmitCancel={submitCancellation}
        onSubmitReview={submitReview}
      />
    </div>
  );
}
