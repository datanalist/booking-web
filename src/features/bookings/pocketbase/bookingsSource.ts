import type { BookingRequest } from "../domain/BookingRequest";
import type { RejectedBooking } from "../domain/RejectedBooking";
import type { CancelledBooking } from "../presentation/cancelled/CancelledBooking";
import type { ConfirmedBooking } from "../presentation/confirmed/ConfirmedBooking";
import type { RequestDecision } from "../presentation/confirmed/request/RequestDecision";
import type { BookingReview } from "../presentation/confirmed/review/BookingReview";

export type BookingsSnapshot = {
  requests: readonly BookingRequest[];
  confirmed: readonly ConfirmedBooking[];
  rejected: readonly RejectedBooking[];
  cancelled: readonly CancelledBooking[];
  /** Отзывы хозяина о госте (`reviews.kind = guest`). Пусто, если снимок их не принёс. */
  guestReviews?: readonly BookingReview[];
};

export type HostGuestReviewLinks = {
  authorId: string;
  guestId?: string;
  listingId?: string;
};

export type BookingsSource = {
  load(hostId: string): Promise<BookingsSnapshot>;
  accept(id: string): Promise<void>;
  reject(id: string, comment: string): Promise<void>;
  hostCancel(id: string, comment: string): Promise<void>;
  resolveRequest(booking: ConfirmedBooking, decision: RequestDecision): Promise<void>;
  createGuestReview(review: BookingReview, links: HostGuestReviewLinks): Promise<void>;
};
