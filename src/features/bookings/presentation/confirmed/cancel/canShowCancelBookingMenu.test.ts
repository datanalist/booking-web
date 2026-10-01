import { expect, test } from "vitest";
import {
  CONFIRMED_BOOKING_STATUS_KINDS,
  type ConfirmedBookingStatus,
  type ConfirmedBookingStatusKind,
} from "../confirmedBookingStatus";
import { canShowCancelBookingMenu } from "./canShowCancelBookingMenu";

function statusOf(kind: ConfirmedBookingStatusKind): ConfirmedBookingStatus {
  switch (kind) {
    case "awaitingPrepayment":
      return { kind, remainingLabel: "осталось 1 час" };
    case "prepaymentPaid":
    case "request":
    case "stayCompleted":
    case "staying":
      return { kind };
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

test("cancel menu is offered only while awaiting prepayment", () => {
  for (const kind of CONFIRMED_BOOKING_STATUS_KINDS) {
    expect(canShowCancelBookingMenu(statusOf(kind))).toBe(
      kind === "awaitingPrepayment",
    );
  }
});
