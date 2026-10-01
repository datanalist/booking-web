import { describe, expect, test } from "vitest";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import type { ConfirmedBookingStatusKind } from "./confirmedBookingStatus";
import { prioritizeConfirmedBookingsByStatus } from "./prioritizeConfirmedBookingsByStatus";

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
  booking("kristina", "request"),
  booking("ivan", "stayCompleted"),
  booking("stepan", "staying"),
  booking("olga", "awaitingPrepayment"),
];

function ids(items: readonly ConfirmedBooking[]): string[] {
  return items.map((item) => item.id);
}

describe("prioritizeConfirmedBookingsByStatus", () => {
  test("keeps source order when nothing is selected", () => {
    expect(ids(prioritizeConfirmedBookingsByStatus(source, []))).toEqual(
      ids(source),
    );
  });

  test("moves one selected status first and keeps both groups in source order", () => {
    expect(
      ids(prioritizeConfirmedBookingsByStatus(source, ["staying"])),
    ).toEqual(["stepan", "anna", "leonid", "kristina", "ivan", "olga"]);
  });

  test("keeps source order inside a multi-status selection and does not drop the rest", () => {
    expect(
      ids(
        prioritizeConfirmedBookingsByStatus(source, [
          "awaitingPrepayment",
          "staying",
        ]),
      ),
    ).toEqual(["anna", "stepan", "olga", "leonid", "kristina", "ivan"]);
  });

  test("leaves the list unchanged when no booking has the selected status", () => {
    const withoutStaying = source.filter((item) => item.status.kind !== "staying");
    expect(
      ids(prioritizeConfirmedBookingsByStatus(withoutStaying, ["staying"])),
    ).toEqual(ids(withoutStaying));
  });
});
