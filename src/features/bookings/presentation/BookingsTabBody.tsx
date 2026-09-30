import type { BookingTabId } from "../bookingTabId";
import { CancelledBookingsPanel } from "./cancelled/CancelledBookingsPanel";
import { ConfirmedBookingsPanel } from "./confirmed/ConfirmedBookingsPanel";
import { RejectedBookingsPanel } from "./rejected/RejectedBookingsPanel";
import { RequestsPanel } from "./requests/RequestsPanel";

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
  switch (tab) {
    case "requests":
      return <RequestsPanel query={query} forceEmpty={forceEmpty} />;
    case "confirmed":
      return <ConfirmedBookingsPanel query={query} forceEmpty={forceEmpty} />;
    case "rejected":
      return <RejectedBookingsPanel query={query} forceEmpty={forceEmpty} />;
    case "cancelled":
      return <CancelledBookingsPanel query={query} forceEmpty={forceEmpty} />;
    default: {
      const exhaustive: never = tab;
      return exhaustive;
    }
  }
}
