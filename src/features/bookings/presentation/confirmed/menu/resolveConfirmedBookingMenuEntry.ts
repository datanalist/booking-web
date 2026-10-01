import type { ConfirmedBookingStatus } from "../confirmedBookingStatus";

/** Which action the «три точки» menu offers for a status (`none` — the trigger is disabled). */
export type ConfirmedBookingMenuEntry = "none" | "cancel" | "openRequest";

export function resolveConfirmedBookingMenuEntry(
  status: ConfirmedBookingStatus,
): ConfirmedBookingMenuEntry {
  switch (status.kind) {
    case "awaitingPrepayment":
      return "cancel";
    case "request":
      return "openRequest";
    case "prepaymentPaid":
    case "stayCompleted":
    case "staying":
      return "none";
  }
}
