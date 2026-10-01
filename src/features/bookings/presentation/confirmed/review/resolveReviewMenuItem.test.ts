import { describe, expect, test } from "vitest";
import { resolveReviewMenuItem } from "./resolveReviewMenuItem";

describe("resolveReviewMenuItem", () => {
  test("для «Аренда завершилась» пункт доступен", () => {
    expect(resolveReviewMenuItem({ kind: "stayCompleted" }, false)).toBe(
      "available",
    );
  });

  test("после отзыва пункт показывает, что отзыв оставлен", () => {
    expect(resolveReviewMenuItem({ kind: "stayCompleted" }, true)).toBe(
      "submitted",
    );
  });

  test("для остальных статусов пункта нет", () => {
    expect(
      resolveReviewMenuItem(
        { kind: "awaitingPrepayment", remainingLabel: "1 день" },
        false,
      ),
    ).toBe("hidden");
    expect(resolveReviewMenuItem({ kind: "prepaymentPaid" }, false)).toBe(
      "hidden",
    );
    expect(
      resolveReviewMenuItem(
        {
          kind: "request",
          previousStatus: { kind: "prepaymentPaid" },
          request: { kind: "cancel" },
        },
        false,
      ),
    ).toBe("hidden");
    expect(resolveReviewMenuItem({ kind: "staying" }, false)).toBe("hidden");
  });
});
