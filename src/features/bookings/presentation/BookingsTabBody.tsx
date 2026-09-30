import type { BookingTabId } from "../bookingTabId";
import { BookingsPlaceholderPanel } from "./BookingsPlaceholderPanel";
import { CancelledBookingsPanel } from "./cancelled/CancelledBookingsPanel";

type BookingsTabBodyProps = {
  tab: BookingTabId;
  query: string;
  forceEmpty: boolean;
};

export function BookingsTabBody({
  tab,
  query,
  forceEmpty,
}: BookingsTabBodyProps) {
  if (tab === "cancelled") {
    return <CancelledBookingsPanel query={query} forceEmpty={forceEmpty} />;
  }
  return <BookingsPlaceholderPanel tab={tab} />;
}
