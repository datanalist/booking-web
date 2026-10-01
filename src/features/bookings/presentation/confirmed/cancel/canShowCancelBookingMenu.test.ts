import { expect, test } from "vitest";
import { statusFixture } from "../confirmedBookingFixture";
import { CONFIRMED_BOOKING_STATUS_KINDS } from "../confirmedBookingStatus";
import { canShowCancelBookingMenu } from "./canShowCancelBookingMenu";

test("cancel menu is offered only while awaiting prepayment", () => {
  for (const kind of CONFIRMED_BOOKING_STATUS_KINDS) {
    expect(canShowCancelBookingMenu(statusFixture(kind))).toBe(
      kind === "awaitingPrepayment",
    );
  }
});
