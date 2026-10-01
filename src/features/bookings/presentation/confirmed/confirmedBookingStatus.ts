import type { PreviousBookingStatus } from "./PreviousBookingStatus";
import type { ConfirmedBookingRequest } from "./request/ConfirmedBookingRequest";

export const CONFIRMED_BOOKING_STATUS_KINDS = [
  "awaitingPrepayment",
  "prepaymentPaid",
  "request",
  "stayCompleted",
  "staying",
] as const;

export type ConfirmedBookingStatusKind =
  (typeof CONFIRMED_BOOKING_STATUS_KINDS)[number];

export type ConfirmedBookingStatus =
  | PreviousBookingStatus
  | {
      kind: "request";
      /** The status the booking returns to when the request is rejected. */
      previousStatus: PreviousBookingStatus;
      request: ConfirmedBookingRequest;
    };

export const CONFIRMED_BOOKING_STATUS_LABELS: Record<
  ConfirmedBookingStatusKind,
  string
> = {
  awaitingPrepayment: "Ожидание предоплаты",
  prepaymentPaid: "Предоплата внесена",
  request: "Запрос",
  stayCompleted: "Аренда завершилась",
  staying: "Проживание",
};
