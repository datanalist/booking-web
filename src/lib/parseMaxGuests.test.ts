import { expect, test } from "vitest";
import { parseMaxGuests } from "./parseMaxGuests";

test("when guests allowed requires at least one", () => {
  expect(parseMaxGuests(0, false)).toBeNull();
  expect(parseMaxGuests(Number.NaN, false)).toBeNull();
  expect(parseMaxGuests(1, false)).toBe(1);
  expect(parseMaxGuests(4, false)).toBe(4);
});

test("when guests forbidden only zero is valid", () => {
  expect(parseMaxGuests(0, true)).toBe(0);
  expect(parseMaxGuests(1, true)).toBeNull();
  expect(parseMaxGuests(Number.NaN, true)).toBeNull();
});
