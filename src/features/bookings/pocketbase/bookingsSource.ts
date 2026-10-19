import type { BookingRequest } from "../domain/BookingRequest";
import type { RejectedBooking } from "../domain/RejectedBooking";
import type { CancelledBooking } from "../presentation/cancelled/CancelledBooking";
import type { ConfirmedBooking } from "../presentation/confirmed/ConfirmedBooking";
import type { RequestDecision } from "../presentation/confirmed/request/RequestDecision";

export type BookingsSnapshot = {
  requests: readonly BookingRequest[];
  confirmed: readonly ConfirmedBooking[];
  rejected: readonly RejectedBooking[];
  cancelled: readonly CancelledBooking[];
};

export type BookingsSource = {
  load(hostId: string): Promise<BookingsSnapshot>;
  accept(id: string): Promise<void>;
  reject(id: string, comment: string): Promise<void>;
  hostCancel(id: string, comment: string): Promise<void>;
  resolveRequest(booking: ConfirmedBooking, decision: RequestDecision): Promise<void>;
};
