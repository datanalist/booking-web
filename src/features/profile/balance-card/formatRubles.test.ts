import { expect, test } from "vitest";
import { formatRubles } from "./formatRubles";

const nbsp = "\u00A0";

test("formatRubles разделяет разряды NBSP и добавляет знак рубля", () => {
  expect(formatRubles(0)).toBe(`0${nbsp}₽`);
  expect(formatRubles(999)).toBe(`999${nbsp}₽`);
  expect(formatRubles(1000)).toBe(`1${nbsp}000${nbsp}₽`);
  expect(formatRubles(34670)).toBe(`34${nbsp}670${nbsp}₽`);
  expect(formatRubles(1234567)).toBe(`1${nbsp}234${nbsp}567${nbsp}₽`);
});
