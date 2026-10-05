import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { ReviewRating } from "./reviewRating";

/** Проверенный отзыв хозяина о госте: рейтинг гарантированно выбран. */
export type BookingReview = {
  bookingId: ConfirmedBooking["id"];
  rating: ReviewRating;
  comment: string;
};
