import { expect, test } from "vitest";
import { confirmedBookingFixture, statusFixture } from "../confirmedBookingFixture";
import { confirmedBookingId } from "../ConfirmedBookingId";
import type { ConfirmedBookingStatusKind } from "../confirmedBookingStatus";
import { cancelAwaitingPrepaymentBooking } from "./cancelAwaitingPrepaymentBooking";
import type { AcceptedCancelReason } from "./parseCancelReason";

const emptyReason: AcceptedCancelReason = { state: "accepted", text: "" };

function booking(id: string, kind: ConfirmedBookingStatusKind) {
  return confirmedBookingFixture(id, statusFixture(kind));
}

const ANNA = confirmedBookingId("anna");
const source = [
  booking("anna", "awaitingPrepayment"),
  booking("leonid", "prepaymentPaid"),
  booking("stepan", "staying"),
];

test("removes only the awaiting-prepayment booking, hands it to «Отменены» and keeps the reason", () => {
  const reason: AcceptedCancelReason = {
    state: "accepted",
    text: "Гость не выходит на связь",
  };
  const result = cancelAwaitingPrepaymentBooking(source, ANNA, reason);

  expect(result.outcome).toBe("cancelled");
  if (result.outcome !== "cancelled") {
    return;
  }
  expect(result.transition.confirmed.map((item) => item.id)).toEqual([
    "leonid",
    "stepan",
  ]);
  expect(result.transition.cancelled.map((item) => item.id)).toEqual(["anna"]);
  expect(result.reason).toBe(reason);
});

test("cancels when the reason is empty", () => {
  const result = cancelAwaitingPrepaymentBooking(source, ANNA, emptyReason);
  expect(result.outcome).toBe("cancelled");
});

test("leaves other statuses in place", () => {
  const result = cancelAwaitingPrepaymentBooking(
    source,
    confirmedBookingId("leonid"),
    emptyReason,
  );
  expect(result).toEqual({ outcome: "unchanged", bookings: source });
});

test("leaves the list unchanged for an unknown id", () => {
  const result = cancelAwaitingPrepaymentBooking(
    source,
    confirmedBookingId("missing"),
    emptyReason,
  );
  expect(result).toEqual({ outcome: "unchanged", bookings: source });
});
