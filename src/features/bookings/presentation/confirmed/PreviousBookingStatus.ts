/**
 * Every status of a confirmed booking except «Запрос». A request is an overlay on a
 * booking that already had one of these, so the type itself rules out nested requests.
 */
export type PreviousBookingStatus =
  | { kind: "awaitingPrepayment"; remainingLabel: string }
  | { kind: "prepaymentPaid" }
  | { kind: "stayCompleted" }
  | { kind: "staying" };
