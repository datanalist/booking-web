import { describe, expect, test } from "vitest";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import { confirmedBookingFixture } from "../confirmedBookingFixture";
import { confirmedBookingId } from "../ConfirmedBookingId";
import type { PreviousBookingStatus } from "../PreviousBookingStatus";
import { bookingStay } from "../stay/BookingStay";
import { resolveBookingRequest } from "./resolveBookingRequest";

const NEW_STAY = bookingStay("2024-12-06", "2024-12-12");
const AWAITING: PreviousBookingStatus = {
  kind: "awaitingPrepayment",
  remainingLabel: "осталось 3 часа",
};

const cancelRow = confirmedBookingFixture("cancel", {
  kind: "request",
  previousStatus: { kind: "prepaymentPaid" },
  request: { kind: "cancel" },
});
const changeRow = confirmedBookingFixture("change", {
  kind: "request",
  previousStatus: AWAITING,
  request: {
    kind: "changeDates",
    proposedStay: NEW_STAY,
    proposedPriceLabel: "18 130 ₽",
  },
});
const plainRow = confirmedBookingFixture("plain", { kind: "staying" });
const source = [cancelRow, changeRow, plainRow];

function ids(items: readonly ConfirmedBooking[]): string[] {
  return items.map((item) => item.id);
}

function resolve(id: string, decision: "accept" | "reject") {
  return resolveBookingRequest(source, confirmedBookingId(id), decision);
}

describe("resolveBookingRequest", () => {
  test("accepted cancellation moves the booking to «Отменены»", () => {
    const result = resolve("cancel", "accept");
    expect(ids(result.confirmed)).toEqual(["change", "plain"]);
    expect(ids(result.cancelled)).toEqual(["cancel"]);
  });

  test("rejected cancellation restores the previous status (prepaid)", () => {
    const result = resolve("cancel", "reject");
    expect(ids(result.confirmed)).toEqual(["cancel", "change", "plain"]);
    expect(result.cancelled).toEqual([]);
    expect(result.confirmed[0]?.status).toEqual({ kind: "prepaymentPaid" });
    expect(result.confirmed[0]?.stay).toEqual(cancelRow.stay);
  });

  test("accepted date change applies new stay and price and restores the previous status", () => {
    const result = resolve("change", "accept");
    const changed = result.confirmed[1];
    expect(changed?.stay).toEqual(NEW_STAY);
    expect(changed?.priceLabel).toBe("18 130 ₽");
    expect(changed?.status).toEqual(AWAITING);
    expect(result.cancelled).toEqual([]);
  });

  test("rejected date change keeps stay and price and restores the previous status (awaiting prepayment)", () => {
    const result = resolve("change", "reject");
    const kept = result.confirmed[1];
    expect(kept?.stay).toEqual(changeRow.stay);
    expect(kept?.priceLabel).toBe("15 460 ₽");
    expect(kept?.status).toEqual(AWAITING);
    expect(result.cancelled).toEqual([]);
  });

  test("different rows return to their own previous statuses", () => {
    const first = resolve("cancel", "reject").confirmed[0]?.status.kind;
    const second = resolve("change", "reject").confirmed[1]?.status.kind;
    expect(first).toBe("prepaymentPaid");
    expect(second).toBe("awaitingPrepayment");
  });

  test("non-request rows and unknown ids are untouched", () => {
    expect(resolve("plain", "accept")).toEqual({ confirmed: source, cancelled: [] });
    expect(resolve("missing", "accept")).toEqual({ confirmed: source, cancelled: [] });
  });
});
