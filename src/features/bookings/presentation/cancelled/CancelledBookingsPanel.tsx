import { BOOKING_EMPTY_COPY } from "../../bookingEmptyCopy";
import { BookingsEmptyCard } from "../BookingsEmptyCard";
import { CANCELLED_BOOKINGS_MOCK } from "./cancelledBookingsMock";
import { CancelledBookingsTable } from "./CancelledBookingsTable";
import { filterCancelledBookings } from "./filterCancelledBookings";

type CancelledBookingsPanelProps = {
  query: string;
  forceEmpty: boolean;
};

export function CancelledBookingsPanel({
  query,
  forceEmpty,
}: CancelledBookingsPanelProps) {
  const items = forceEmpty
    ? []
    : filterCancelledBookings(CANCELLED_BOOKINGS_MOCK, query);

  if (items.length === 0) {
    return <BookingsEmptyCard copy={BOOKING_EMPTY_COPY.cancelled} />;
  }

  return <CancelledBookingsTable items={items} />;
}
