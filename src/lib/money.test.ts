import { expect, test } from "vitest";
import { commissionOf, clientPriceOf } from "./money";

test("3500 → 315 commission", () => {
  expect(commissionOf(3500)).toBe(315);
});

test("3500 → 3815 client price", () => {
  expect(clientPriceOf(3500)).toBe(3815);
});
