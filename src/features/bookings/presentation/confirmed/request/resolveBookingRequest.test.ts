import { describe, expect, test } from "vitest";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ConfirmedBookingStatus } from "../confirmedBookingStatus";
import { bookingStay } from "../stay/BookingStay";
import { resolveBookingRequest } from "./resolveBookingRequest";

const NEW_STAY = bookingStay("2024-12-06", "2024-12-12");

function booking(id: string, status: ConfirmedBookingStatus): ConfirmedBooking {
  return {
    id,
    guestName: id,
    guestPhone: "+7 (900) 123-45-67",
    guestAvatarUrl: "/a.png",
    housingTitle: "Жильё",
    housingAddress: "Адрес",
    housingPhotoUrl: "/h.jpg",
    stay: bookingStay("2024-12-05", "2024-12-10"),
    priceLabel: "15 460 ₽",
    status,
  };
}

const cancelRow = booking("cancel", {
  kind: "request",
  request: { kind: "cancel" },
});
const changeRow = booking("change", {
  kind: "request",
  request: {
    kind: "changeDates",
    proposedStay: NEW_STAY,
    proposedPriceLabel: "18 130 ₽",
  },
});
const plainRow = booking("plain", { kind: "staying" });
const source = [cancelRow, changeRow, plainRow];

describe("resolveBookingRequest", () => {
  test("accepted cancellation removes the booking", () => {
    const result = resolveBookingRequest(source, "cancel", "accept");
    expect(result.map((b) => b.id)).toEqual(["change", "plain"]);
  });

  test("rejected cancellation keeps the booking without the request", () => {
    const result = resolveBookingRequest(source, "cancel", "reject");
    expect(result.map((b) => b.id)).toEqual(["cancel", "change", "plain"]);
    expect(result[0]?.status).toEqual({ kind: "prepaymentPaid" });
    expect(result[0]?.stay).toEqual(cancelRow.stay);
  });

  test("accepted date change applies new stay and price", () => {
    const changed = resolveBookingRequest(source, "change", "accept")[1];
    expect(changed?.stay).toEqual(NEW_STAY);
    expect(changed?.priceLabel).toBe("18 130 ₽");
    expect(changed?.status).toEqual({ kind: "prepaymentPaid" });
  });

  test("rejected date change keeps current stay and price", () => {
    const kept = resolveBookingRequest(source, "change", "reject")[1];
    expect(kept?.stay).toEqual(changeRow.stay);
    expect(kept?.priceLabel).toBe("15 460 ₽");
    expect(kept?.status).toEqual({ kind: "prepaymentPaid" });
  });

  test("non-request rows and unknown ids are untouched", () => {
    expect(resolveBookingRequest(source, "plain", "accept")).toEqual(source);
    expect(resolveBookingRequest(source, "missing", "accept")).toEqual(source);
  });
});
