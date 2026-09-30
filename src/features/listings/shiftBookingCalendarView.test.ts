import { expect, test } from "vitest";
import { shiftBookingCalendarView } from "./shiftBookingCalendarView";

test("сдвиг с 31 января оставляет последний день февраля", () => {
  expect(
    shiftBookingCalendarView(
      { month: { year: 2025, month: 1 }, selectedDay: 31 },
      1,
    ),
  ).toEqual({ month: { year: 2025, month: 2 }, selectedDay: 28 });
});

test("сдвиг декабря 2024 назад открывает ноябрь с тем же днём", () => {
  expect(
    shiftBookingCalendarView(
      { month: { year: 2024, month: 12 }, selectedDay: 15 },
      -1,
    ),
  ).toEqual({ month: { year: 2024, month: 11 }, selectedDay: 15 });
});
