import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { BookingReview } from "./BookingReview";

type Listener = () => void;

/**
 * Мок-слой хранения отзывов: бэкенда нет, поэтому отзывы живут в памяти
 * модуля до перезагрузки страницы (как и мок-данные бронирований).
 */
let reviews: ReadonlyMap<ConfirmedBooking["id"], BookingReview> = new Map();
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export const bookingReviewsStore = {
  get(bookingId: ConfirmedBooking["id"]): BookingReview | undefined {
    return reviews.get(bookingId);
  },

  save(review: BookingReview): void {
    reviews = new Map(reviews).set(review.bookingId, review);
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  reset(): void {
    reviews = new Map();
    notify();
  },
};
