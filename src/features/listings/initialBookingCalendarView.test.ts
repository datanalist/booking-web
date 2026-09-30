import { expect, test } from "vitest";
import { initialBookingCalendarView } from "./initialBookingCalendarView";

test("вид календаря берёт год, месяц и день из переданной даты", () => {
  expect(initialBookingCalendarView(new Date(2026, 9, 1, 23, 45))).toEqual({
    month: { year: 2026, month: 10 },
    selectedDay: 1,
  });
  expect(initialBookingCalendarView(new Date(2024, 11, 15))).toEqual({
    month: { year: 2024, month: 12 },
    selectedDay: 15,
  });
});
