import { describe, expect, test } from "vitest";
import { parseBookingReview } from "./parseBookingReview";
import { REVIEW_COMMENT_MAX_LENGTH } from "./reviewCommentMaxLength";

describe("parseBookingReview", () => {
  test("без рейтинга отзыв не создаётся (Отправить недоступна)", () => {
    expect(
      parseBookingReview("confirmed-4", { rating: null, comment: "Отлично" }),
    ).toBeNull();
  });

  test("с рейтингом и пустым комментарием отзыв создаётся", () => {
    expect(
      parseBookingReview("confirmed-4", { rating: 4, comment: "  " }),
    ).toEqual({ bookingId: "confirmed-4", rating: 4, comment: "" });
  });

  test("комментарий обрезается по краям и ограничивается 500 символами", () => {
    const review = parseBookingReview("confirmed-4", {
      rating: 5,
      comment: ` ${"а".repeat(REVIEW_COMMENT_MAX_LENGTH + 20)} `,
    });
    expect(review?.comment).toHaveLength(REVIEW_COMMENT_MAX_LENGTH);
  });
});
