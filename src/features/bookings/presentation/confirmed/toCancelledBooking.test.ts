import { expect, test } from "vitest";
import { rub } from "../../../../lib/money";
import { confirmedBookingFixture } from "./confirmedBookingFixture";
import { parseRubLabel } from "./parseRubLabel";
import { toCancelledBooking } from "./toCancelledBooking";

test("parseRubLabel reads the amount from a display label", () => {
  expect(parseRubLabel("15 460 ₽")).toBe(rub(15460));
  expect(parseRubLabel("15\u00a0460\u00a0₽")).toBe(rub(15460));
  expect(parseRubLabel("")).toBe(rub(0));
});

test("toCancelledBooking carries guest, housing, dates and price", () => {
  const booking = confirmedBookingFixture("confirmed-3", {
    kind: "prepaymentPaid",
  });
  expect(toCancelledBooking(booking)).toEqual({
    id: "confirmed-3",
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    guestAvatarUrl: booking.guestAvatarUrl,
    housingTitle: booking.housingTitle,
    housingAddress: booking.housingAddress,
    housingPhotoUrl: booking.housingPhotoUrl,
    datesLabel: "05.12.24-10.12.24",
    price: rub(15460),
  });
});
