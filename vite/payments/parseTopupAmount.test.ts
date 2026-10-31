import { expect, test } from "vitest";
import { parseTopupAmount } from "./parseTopupAmount.ts";

test("принимает целые рубли от 1 до 1 000 000", () => {
  expect(parseTopupAmount(1)).toEqual({ ok: true, rubles: 1 });
  expect(parseTopupAmount("10")).toEqual({ ok: true, rubles: 10 });
  expect(parseTopupAmount(" 10 ")).toEqual({ ok: true, rubles: 10 });
});

test("отклоняет ноль, дробь, мусор и слишком большую сумму", () => {
  expect(parseTopupAmount(0).ok).toBe(false);
  expect(parseTopupAmount(-5).ok).toBe(false);
  expect(parseTopupAmount(1.5).ok).toBe(false);
  expect(parseTopupAmount("1.50").ok).toBe(false);
  expect(parseTopupAmount("1e2").ok).toBe(false);
  expect(parseTopupAmount("01").ok).toBe(false);
  expect(parseTopupAmount("1000001").ok).toBe(false);
  expect(parseTopupAmount("abc").ok).toBe(false);
  expect(parseTopupAmount("").ok).toBe(false);
  expect(parseTopupAmount(null).ok).toBe(false);
  expect(parseTopupAmount(Number.POSITIVE_INFINITY).ok).toBe(false);
});
