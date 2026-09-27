import { expect, test } from "vitest";
import { formatPhoneMask } from "./formatPhoneMask";

test("formats russian mobile as +7 (XXX) XXX-XX-XX", () => {
  expect(formatPhoneMask("79001234567")).toBe("+7 (900) 123-45-67");
  expect(formatPhoneMask("9001234567")).toBe("+7 (900) 123-45-67");
  expect(formatPhoneMask("89001234567")).toBe("+7 (900) 123-45-67");
});

test("keeps partial mask while typing", () => {
  expect(formatPhoneMask("")).toBe("+7");
  expect(formatPhoneMask("90")).toBe("+7 (90");
  expect(formatPhoneMask("900")).toBe("+7 (900)");
});
