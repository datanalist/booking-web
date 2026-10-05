import type { ConfirmedBooking } from "../ConfirmedBooking";
import type { BookingReview } from "./BookingReview";
import type { ReviewDraft } from "./ReviewDraft";
import { REVIEW_COMMENT_MAX_LENGTH } from "./reviewCommentMaxLength";

/**
 * Превращает черновик в отзыв. Возвращает null, пока не выбран рейтинг —
 * то есть «Отправить» доступна ровно тогда, когда результат не null.
 */
export function parseBookingReview(
  bookingId: ConfirmedBooking["id"],
  draft: ReviewDraft,
): BookingReview | null {
  if (draft.rating === null) {
    return null;
  }
  return {
    bookingId,
    rating: draft.rating,
    comment: draft.comment.trim().slice(0, REVIEW_COMMENT_MAX_LENGTH),
  };
}
