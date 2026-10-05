import { useCallback, useMemo, useState } from "react";
import { BOOKING_EMPTY_COPY } from "../../bookingEmptyCopy";
import { BookingsEmptyCard } from "../../BookingsEmptyCard";
import { applyBookingsTransition } from "./applyBookingsTransition";
import { cancelAwaitingPrepaymentBooking } from "./cancel/cancelAwaitingPrepaymentBooking";
import type { AcceptedCancelReason } from "./cancel/parseCancelReason";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import type { ConfirmedBookingId } from "./ConfirmedBookingId";
import type { ConfirmedStatusSortOption } from "./confirmedStatusSortOption";
import { ConfirmedBookingsTable } from "./ConfirmedBookingsTable";
import { ConfirmedStatusSortControl } from "./ConfirmedStatusSortControl";
import type { ConfirmedBookingDialog } from "./dialog/ConfirmedBookingDialog";
import { ConfirmedBookingDialogHost } from "./dialog/ConfirmedBookingDialogHost";
import { filterConfirmedBookings } from "./filterConfirmedBookings";
import type { ConfirmedBookingRowActions } from "./menu/ConfirmedBookingRowActions";
import { toggleOpenMenu } from "./menu/toggleOpenMenu";
import { prioritizeConfirmedBookingsByStatus } from "./prioritizeConfirmedBookingsByStatus";
import type { RequestDecision } from "./request/RequestDecision";
import { resolveBookingRequest } from "./request/resolveBookingRequest";
import type { BookingReview } from "./review/BookingReview";
import { bookingReviewsStore } from "./review/bookingReviewsStore";
import { useConfirmedBookings } from "./useConfirmedBookings";

type ConfirmedBookingsPanelProps = {
  query: string;
  forceEmpty: boolean;
};

export function ConfirmedBookingsPanel({
  query,
  forceEmpty,
}: ConfirmedBookingsPanelProps) {
  const [sort, setSort] = useState<ConfirmedStatusSortOption>("all");
  const bookings = useConfirmedBookings();
  // One id for the whole table: at most one row menu is open at a time.
  const [openMenuId, setOpenMenuId] = useState<ConfirmedBookingId | null>(null);
  const [dialog, setDialog] = useState<ConfirmedBookingDialog | null>(null);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);
  const closeDialog = useCallback(() => setDialog(null), []);

  const rowActions: ConfirmedBookingRowActions = {
    openMenuId,
    onToggleMenu: (bookingId) =>
      setOpenMenuId((current) => toggleOpenMenu(current, bookingId)),
    onCloseMenu: closeMenu,
    onOpenDialog: (next) => {
      setOpenMenuId(null);
      setDialog(next);
    },
  };

  function decideRequest(
    bookingId: ConfirmedBookingId,
    decision: RequestDecision,
  ): void {
    applyBookingsTransition(resolveBookingRequest(bookings, bookingId, decision));
    closeDialog();
  }

  function submitCancellation(
    bookingId: ConfirmedBookingId,
    reason: AcceptedCancelReason,
  ): void {
    const result = cancelAwaitingPrepaymentBooking(bookings, bookingId, reason);
    if (result.outcome === "cancelled") {
      applyBookingsTransition(result.transition);
    }
    closeDialog();
  }

  function submitReview(review: BookingReview): void {
    bookingReviewsStore.save(review);
    closeDialog();
  }

  const visibleItems = useMemo((): ConfirmedBooking[] => {
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
      <ConfirmedBookingsTable items={visibleItems} actions={rowActions} />
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
