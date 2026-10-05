import { BOOKING_EMPTY_COPY } from "../../bookingEmptyCopy";
import { BookingsEmptyCard } from "../BookingsEmptyCard";
import { CancelledBookingsTable } from "./CancelledBookingsTable";
import { filterCancelledBookings } from "./filterCancelledBookings";
import { useCancelledBookings } from "./useCancelledBookings";

type CancelledBookingsPanelProps = {
  query: string;
  forceEmpty: boolean;
};

export function CancelledBookingsPanel({
  query,
  forceEmpty,
}: CancelledBookingsPanelProps) {
  const bookings = useCancelledBookings();
  const items = forceEmpty ? [] : filterCancelledBookings(bookings, query);

  if (items.length === 0) {
    return <BookingsEmptyCard copy={BOOKING_EMPTY_COPY.cancelled} />;
  }

  return <CancelledBookingsTable items={items} />;
}
