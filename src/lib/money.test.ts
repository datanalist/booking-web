import { expect, test } from "vitest";
import { commissionOf, clientPriceOf, formatRub, rub } from "./money";

test("3500 → 315 commission", () => {
  expect(commissionOf(3500)).toBe(315);
});

test("3500 → 3815 client price", () => {
  expect(clientPriceOf(3500)).toBe(3815);
});

test("formatRub includes currency unit", () => {
  expect(formatRub(0)).toBe("0 ₽");
  expect(formatRub(rub(3500))).toMatch(/3[\u00a0\u202f ]?500 ₽/);
});

test("rub rejects NaN and negatives", () => {
  expect(rub(Number.NaN)).toBe(0);
  expect(rub(-10)).toBe(0);
});
