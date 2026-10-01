import type { ConfirmedBookingStatus } from "../confirmedBookingStatus";

/** Which action the «три точки» menu offers for a status (`none` — the trigger is disabled). */
export type ConfirmedBookingMenuEntry =
  | "none"
  | "review"
  | "cancel"
  | "openRequest";

export function resolveConfirmedBookingMenuEntry(
  status: ConfirmedBookingStatus,
): ConfirmedBookingMenuEntry {
  switch (status.kind) {
    case "stayCompleted":
      return "review";
    case "awaitingPrepayment":
      return "cancel";
    case "request":
      return "openRequest";
    case "prepaymentPaid":
    case "staying":
      return "none";
  }
}
