import { expect, test } from "vitest";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ConfirmedBookingStatusKind } from "../confirmedBookingStatus";
import { cancelAwaitingPrepaymentBooking } from "./cancelAwaitingPrepaymentBooking";
import type { AcceptedCancelReason } from "./parseCancelReason";

const emptyReason: AcceptedCancelReason = { state: "accepted", text: "" };

function booking(
  id: string,
  kind: ConfirmedBookingStatusKind,
): ConfirmedBooking {
  return {
    id,
    guestName: id,
    guestPhone: "+7 (900) 123-45-67",
    guestAvatarUrl: "/a.png",
    housingTitle: "Жильё",
    housingAddress: "Адрес",
    housingPhotoUrl: "/h.jpg",
    datesLabel: "14.11.24-19.11.24",
    priceLabel: "15 460 ₽",
    status:
      kind === "awaitingPrepayment"
        ? { kind, remainingLabel: "осталось 1 час" }
        : { kind },
  };
}

const source = [
  booking("anna", "awaitingPrepayment"),
  booking("leonid", "prepaymentPaid"),
  booking("stepan", "staying"),
];

test("removes only the awaiting-prepayment booking and keeps the reason", () => {
  const reason: AcceptedCancelReason = {
    state: "accepted",
    text: "Гость не выходит на связь",
  };
  const result = cancelAwaitingPrepaymentBooking(source, "anna", reason);

  expect(result.outcome).toBe("cancelled");
  if (result.outcome !== "cancelled") {
    return;
  }
  expect(result.bookings.map((item) => item.id)).toEqual(["leonid", "stepan"]);
  expect(result.reason).toBe(reason);
});

test("cancels when the reason is empty", () => {
  const result = cancelAwaitingPrepaymentBooking(source, "anna", emptyReason);
  expect(result.outcome).toBe("cancelled");
});

test("leaves other statuses in place", () => {
  const result = cancelAwaitingPrepaymentBooking(source, "leonid", emptyReason);
  expect(result).toEqual({ outcome: "unchanged", bookings: source });
});

test("leaves the list unchanged for an unknown id", () => {
  const result = cancelAwaitingPrepaymentBooking(source, "missing", emptyReason);
  expect(result).toEqual({ outcome: "unchanged", bookings: source });
});
