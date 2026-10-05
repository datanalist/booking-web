import type { ConfirmedBookingStatus } from "../confirmedBookingStatus";

/**
 * hidden — пункта нет; available — можно оставить отзыв;
 * submitted — отзыв уже оставлен (показываем неактивную отметку).
 */
export type ReviewMenuItemState = "hidden" | "available" | "submitted";

export function resolveReviewMenuItem(
  status: ConfirmedBookingStatus,
  alreadyReviewed: boolean,
): ReviewMenuItemState {
  switch (status.kind) {
    case "stayCompleted":
      return alreadyReviewed ? "submitted" : "available";
    case "awaitingPrepayment":
    case "prepaymentPaid":
    case "request":
    case "staying":
      return "hidden";
  }
}
