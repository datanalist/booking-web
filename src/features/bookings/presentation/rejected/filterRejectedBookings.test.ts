import { describe, expect, it } from "vitest";
import { REJECTED_BOOKING_MOCKS } from "../../data/rejectedBookingMocks";
import { filterRejectedBookings } from "./filterRejectedBookings";

describe("filterRejectedBookings", () => {
  it("returns all items for empty query", () => {
    expect(filterRejectedBookings(REJECTED_BOOKING_MOCKS, "  ")).toHaveLength(
      5,
    );
  });

  it("filters by guest name", () => {
    const result = filterRejectedBookings(REJECTED_BOOKING_MOCKS, "петров");
    expect(result).toHaveLength(1);
    expect(result[0]?.guestName).toBe("Петров Иван");
  });

  it("filters by phone digits", () => {
    const result = filterRejectedBookings(REJECTED_BOOKING_MOCKS, "900123");
    expect(result).toHaveLength(5);
  });

  it("returns empty list when nothing matches", () => {
    expect(
      filterRejectedBookings(REJECTED_BOOKING_MOCKS, "нет такого гостя"),
    ).toHaveLength(0);
  });
});
