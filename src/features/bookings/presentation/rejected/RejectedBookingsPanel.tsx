import { useMemo } from "react";
import { REJECTED_BOOKING_MOCKS } from "../../data/rejectedBookingMocks";
import { BOOKING_EMPTY_COPY } from "../../domain/bookingEmptyCopy";
import { BookingsEmptyPanel } from "../BookingsEmptyPanel";
import { filterRejectedBookings } from "./filterRejectedBookings";
import { RejectedBookingsTable } from "./RejectedBookingsTable";

type RejectedBookingsPanelProps = {
  query: string;
  forceEmpty: boolean;
};

export function RejectedBookingsPanel({
  query,
  forceEmpty,
}: RejectedBookingsPanelProps) {
  const visible = useMemo(() => {
    if (forceEmpty) {
      return [];
    }
    return filterRejectedBookings(REJECTED_BOOKING_MOCKS, query);
  }, [forceEmpty, query]);

  if (visible.length === 0) {
    return (
      <BookingsEmptyPanel
        title={BOOKING_EMPTY_COPY.rejected.title}
        description={BOOKING_EMPTY_COPY.rejected.description}
      />
    );
  }

  return <RejectedBookingsTable items={visible} />;
}
