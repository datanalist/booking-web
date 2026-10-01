import { describe, expect, test } from "vitest";
import type { BookingRequest } from "../../domain/BookingRequest";
import { bookingRequestId } from "../../domain/BookingRequest";
import { filterBookingRequests } from "./filterBookingRequests";

const sample: BookingRequest = {
  id: bookingRequestId("1"),
  guestName: "Иваненко Анна",
  guestPhone: "+7 (900) 123-45-67",
  guestAvatarUrl: "/a.png",
  listingTitle: "Studio",
  listingAddress: "Moscow",
  listingPhotoUrl: "/l.svg",
  datesLabel: "1-2",
  priceLabel: "100 ₽",
};

describe("filterBookingRequests", () => {
  test("matches phone by digits", () => {
    expect(filterBookingRequests([sample], "900123").map((item) => item.id)).toEqual([
      sample.id,
    ]);
  });

  test("returns empty when nothing matches", () => {
    expect(filterBookingRequests([sample], "петров")).toEqual([]);
  });
});
