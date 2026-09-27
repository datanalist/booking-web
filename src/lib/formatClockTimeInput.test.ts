import { expect, test } from "vitest";
import { formatClockTimeInput } from "./formatClockTimeInput";

test("formatClockTimeInput keeps digits and inserts colon", () => {
  expect(formatClockTimeInput("")).toBe("");
  expect(formatClockTimeInput("1")).toBe("1");
  expect(formatClockTimeInput("14")).toBe("14");
  expect(formatClockTimeInput("140")).toBe("14:0");
  expect(formatClockTimeInput("1400")).toBe("14:00");
  expect(formatClockTimeInput("14:00")).toBe("14:00");
});

test("formatClockTimeInput strips non-digits and clamps HH:MM", () => {
  expect(formatClockTimeInput("ab")).toBe("");
  expect(formatClockTimeInput("9a")).toBe("09");
  expect(formatClockTimeInput("25")).toBe("23");
  expect(formatClockTimeInput("1960")).toBe("19:50");
  expect(formatClockTimeInput("1460")).toBe("14:50");
  expect(formatClockTimeInput("146099")).toBe("14:50");
});
