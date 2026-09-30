import { expect, test } from "vitest";
import { bookingCalendarDemoFor } from "./bookingCalendarDemoFor";
import { bookingCalendarMarksFor } from "./bookingCalendarMarksFor";

test("демо-брони и гости привязаны к месяцу переданной даты", () => {
  const october = bookingCalendarMarksFor(new Date(2026, 9, 1));
  expect(october.year).toBe(2026);
  expect(october.month).toBe(10);
  expect(october.ranges).toEqual([
    { fromDay: 5, toDay: 10, tone: "purple" },
    { fromDay: 13, toDay: 14, tone: "green" },
    { fromDay: 21, toDay: 23, tone: "blue" },
  ]);
  expect(october.unavailableDays).toEqual([16, 17, 18, 27, 28, 29, 30, 31]);
  expect(bookingCalendarDemoFor(new Date(2026, 9, 1)).guests.map((guest) => guest.dates)).toEqual([
    "5-10 октября",
    "13-14 октября",
    "21-23 октября",
  ]);
});

test("в феврале недоступные дни не выходят за длину месяца", () => {
  const february = bookingCalendarMarksFor(new Date(2025, 1, 10));
  expect(february.unavailableDays).toEqual([16, 17, 18, 27, 28]);
  expect(february.ranges.map((range) => range.toDay)).toEqual([10, 14, 23]);
});
