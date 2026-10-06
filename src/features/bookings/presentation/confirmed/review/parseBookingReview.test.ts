import { describe, expect, test } from "vitest";
import { confirmedBookingId } from "../ConfirmedBookingId";
import { parseBookingReview } from "./parseBookingReview";
import { REVIEW_COMMENT_MAX_LENGTH } from "./reviewCommentMaxLength";

const ID = confirmedBookingId("confirmed-4");

describe("parseBookingReview", () => {
  test("без рейтинга отзыв не создаётся (Отправить недоступна)", () => {
    expect(
      parseBookingReview(ID, { rating: null, comment: "Отлично" }),
    ).toBeNull();
  });

  test("с рейтингом и пустым комментарием отзыв создаётся", () => {
    expect(
      parseBookingReview(ID, { rating: 4, comment: "  " }),
    ).toEqual({ bookingId: "confirmed-4", rating: 4, comment: "" });
  });

  test("комментарий обрезается по краям и ограничивается 500 символами", () => {
    const review = parseBookingReview(ID, {
      rating: 5,
      comment: ` ${"а".repeat(REVIEW_COMMENT_MAX_LENGTH + 20)} `,
    });
    expect(review?.comment).toHaveLength(REVIEW_COMMENT_MAX_LENGTH);
  });
});
