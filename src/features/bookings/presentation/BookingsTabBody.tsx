import type { BookingTabId } from "../bookingTabId";
import type { BookingRequest, BookingRequestId } from "../domain/BookingRequest";
import { CancelledBookingsPanel } from "./cancelled/CancelledBookingsPanel";
import type { ConfirmedBooking } from "./confirmed/ConfirmedBooking";
import type { ConfirmedBookingId } from "./confirmed/ConfirmedBookingId";
import { ConfirmedBookingsPanel } from "./confirmed/ConfirmedBookingsPanel";
import type { RequestDecision } from "./confirmed/request/RequestDecision";
import { RejectedBookingsPanel } from "./rejected/RejectedBookingsPanel";
import { RequestsPanel } from "./requests/RequestsPanel";

type BookingsTabBodyProps = {
  tab: BookingTabId;
  query: string;
  forceEmpty: boolean;
  requests?: readonly BookingRequest[];
  onAccept?: (id: BookingRequestId) => void;
  onReject?: (id: BookingRequestId, comment: string) => void;
  onHostCancel?: (id: ConfirmedBookingId, comment: string) => void;
  onResolveRequest?: (booking: ConfirmedBooking, decision: RequestDecision) => void;
};

export function BookingsTabBody({
  tab,
  query,
  forceEmpty,
  requests,
  onAccept,
  onReject,
  onHostCancel,
  onResolveRequest,
}: BookingsTabBodyProps) {
  switch (tab) {
    case "requests":
      return (
        <RequestsPanel
          query={query}
          forceEmpty={forceEmpty}
          items={requests}
          onAccept={onAccept}
          onReject={onReject}
        />
      );
    case "confirmed":
      return (
        <ConfirmedBookingsPanel
          query={query}
          forceEmpty={forceEmpty}
          onHostCancel={onHostCancel}
          onResolveRequest={onResolveRequest}
        />
      );
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
