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
  | { kind: "awaitingPrepayment"; remainingLabel: string }
  | { kind: "prepaymentPaid" }
  | { kind: "request" }
  | { kind: "stayCompleted" }
  | { kind: "staying" };

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
