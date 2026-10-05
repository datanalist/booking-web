import type { ConfirmedBookingStatus } from "../confirmedBookingStatus";

export function canShowCancelBookingMenu(
  status: ConfirmedBookingStatus,
): boolean {
  switch (status.kind) {
    case "awaitingPrepayment":
      return true;
    case "prepaymentPaid":
    case "request":
    case "stayCompleted":
    case "staying":
      return false;
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
