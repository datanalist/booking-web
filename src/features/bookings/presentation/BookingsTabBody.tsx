import type { BookingTabId } from "../bookingTabId";
import type { BookingRequest, BookingRequestId } from "../domain/BookingRequest";
import type { RejectedBooking } from "../domain/RejectedBooking";
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
  pending?: boolean;
  requests?: readonly BookingRequest[];
  rejected?: readonly RejectedBooking[];
  onAccept?: (id: BookingRequestId) => void | Promise<void>;
  onReject?: (id: BookingRequestId, comment: string) => void | Promise<void>;
  onHostCancel?: (id: ConfirmedBookingId, comment: string) => void | Promise<void>;
  onResolveRequest?: (
    booking: ConfirmedBooking,
    decision: RequestDecision,
  ) => void | Promise<void>;
};

export function BookingsTabBody({
  tab,
  query,
  forceEmpty,
  pending = false,
  requests,
  rejected,
  onAccept,
  onReject,
  onHostCancel,
  onResolveRequest,
}: BookingsTabBodyProps) {
  if (pending) {
    return <div className="min-h-0 flex-1" aria-busy="true" />;
  }

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
      return (
        <RejectedBookingsPanel
          query={query}
          forceEmpty={forceEmpty}
          {...(rejected !== undefined ? { items: rejected } : {})}
        />
      );
    case "cancelled":
      return <CancelledBookingsPanel query={query} forceEmpty={forceEmpty} />;
    default: {
      const exhaustive: never = tab;
      return exhaustive;
    }
  }
}
