import { useSyncExternalStore } from "react";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { BookingReview } from "./BookingReview";
import { bookingReviewsStore } from "./bookingReviewsStore";

export function useBookingReview(
  bookingId: ConfirmedBooking["id"],
): BookingReview | undefined {
  return useSyncExternalStore(bookingReviewsStore.subscribe, () =>
    bookingReviewsStore.get(bookingId),
  );
}
