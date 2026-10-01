import { expect, test } from "vitest";
import type { ConfirmedBookingStatus } from "../confirmedBookingStatus";
import { resolveConfirmedBookingMenuEntry } from "./resolveConfirmedBookingMenuEntry";

test("each status maps to its menu entry", () => {
  const cases: ReadonlyArray<
    readonly [ConfirmedBookingStatus, ReturnType<typeof resolveConfirmedBookingMenuEntry>]
  > = [
    [{ kind: "stayCompleted" }, "review"],
    [{ kind: "awaitingPrepayment", remainingLabel: "осталось 1 час" }, "cancel"],
    [
      { kind: "request", request: { kind: "cancel" } },
      "openRequest",
    ],
    [{ kind: "prepaymentPaid" }, "none"],
    [{ kind: "staying" }, "none"],
  ];
  for (const [status, entry] of cases) {
    expect(resolveConfirmedBookingMenuEntry(status)).toBe(entry);
  }
});
