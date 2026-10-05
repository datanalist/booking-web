import { expect, test } from "vitest";
import {
  CANCEL_REASON_MAX_LENGTH,
  parseCancelReason,
} from "./parseCancelReason";

test("empty reason is accepted", () => {
  expect(parseCancelReason("")).toEqual({ state: "accepted", text: "" });
});

test("reason at the limit is accepted", () => {
  const text = "а".repeat(CANCEL_REASON_MAX_LENGTH);
  expect(parseCancelReason(text)).toEqual({ state: "accepted", text });
});

test("reason over the limit is rejected", () => {
  const text = "а".repeat(CANCEL_REASON_MAX_LENGTH + 1);
  expect(parseCancelReason(text)).toEqual({ state: "tooLong" });
});
