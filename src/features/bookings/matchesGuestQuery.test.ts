import { expect, test } from "vitest";
import { matchesGuestQuery } from "./matchesGuestQuery";

test("matches by guest name case-insensitively", () => {
  expect(
    matchesGuestQuery("Иваненко Анна", "+7 (900) 123-45-67", "анна"),
  ).toBe(true);
});

test("matches by phone digits ignoring mask", () => {
  expect(
    matchesGuestQuery("Иваненко Анна", "+7 (900) 123-45-67", "900123"),
  ).toBe(true);
});

test("empty query matches everything", () => {
  expect(matchesGuestQuery("A", "1", "   ")).toBe(true);
});

test("non-matching query returns false", () => {
  expect(
    matchesGuestQuery("Иваненко Анна", "+7 (900) 123-45-67", "Петров"),
  ).toBe(false);
});
