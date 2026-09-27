import { expect, test } from "vitest";
import { parseClockTime } from "./clockTime";

test("parseClockTime accepts HH:MM in 24h", () => {
  expect(parseClockTime("00:00")).toBe("00:00");
  expect(parseClockTime("09:30")).toBe("09:30");
  expect(parseClockTime("14:00")).toBe("14:00");
  expect(parseClockTime("23:59")).toBe("23:59");
});

test("parseClockTime rejects invalid or incomplete values", () => {
  expect(parseClockTime("")).toBeNull();
  expect(parseClockTime("14:0")).toBeNull();
  expect(parseClockTime("14")).toBeNull();
  expect(parseClockTime("24:00")).toBeNull();
  expect(parseClockTime("12:60")).toBeNull();
  expect(parseClockTime("9:30")).toBeNull();
  expect(parseClockTime("14:00 AM")).toBeNull();
  expect(parseClockTime("abc")).toBeNull();
});

test("parseClockTime trims whitespace", () => {
  expect(parseClockTime("  12:45  ")).toBe("12:45");
});
