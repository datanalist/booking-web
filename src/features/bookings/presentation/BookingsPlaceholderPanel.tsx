import { BOOKING_EMPTY_COPY } from "../bookingEmptyCopy";
import type { BookingTabId } from "../bookingTabId";
import { BookingsEmptyCard } from "./BookingsEmptyCard";

type BookingsPlaceholderPanelProps = {
  tab: Exclude<BookingTabId, "cancelled">;
};

export function BookingsPlaceholderPanel({
  tab,
}: BookingsPlaceholderPanelProps) {
  return <BookingsEmptyCard copy={BOOKING_EMPTY_COPY[tab]} />;
}
