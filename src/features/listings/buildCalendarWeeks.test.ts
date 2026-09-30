import { expect, test } from "vitest";
import { buildCalendarWeeks } from "./buildCalendarWeeks";
import { daysInYearMonth } from "./daysInYearMonth";
import { mondayIndexOfMonthStart } from "./mondayIndexOfMonthStart";
import type { CalendarGridCell } from "./CalendarGridCell";

test("декабрь 2024 начинается в воскресенье и содержит 31 день", () => {
  expect(daysInYearMonth({ year: 2024, month: 12 })).toBe(31);
  expect(mondayIndexOfMonthStart({ year: 2024, month: 12 })).toBe(6);

  const weeks = buildCalendarWeeks({ year: 2024, month: 12 });
  const firstWeek = weeks[0];
  expect(firstWeek).toBeDefined();
  if (firstWeek === undefined) {
    return;
  }
  expect(firstWeek.slice(0, 6).every((cell) => cell.kind === "pad")).toBe(true);
  expect(firstWeek[6]).toEqual({
    kind: "day",
    day: 1,
    mark: { kind: "available" },
  });
  expect(dayCells(weeks)).toHaveLength(31);
  expect(markOf(weeks, 5)).toEqual({ kind: "booked", tone: "purple" });
  expect(markOf(weeks, 13)).toEqual({ kind: "booked", tone: "green" });
  expect(markOf(weeks, 21)).toEqual({ kind: "booked", tone: "blue" });
  expect(markOf(weeks, 15)).toEqual({ kind: "available" });
  expect(markOf(weeks, 16)).toEqual({ kind: "unavailable" });
  expect(markOf(weeks, 31)).toEqual({ kind: "unavailable" });
});

test("месяц без демо-броней целиком доступен", () => {
  expect(daysInYearMonth({ year: 2025, month: 1 })).toBe(31);
  expect(mondayIndexOfMonthStart({ year: 2025, month: 1 })).toBe(2);
  const weeks = buildCalendarWeeks({ year: 2025, month: 1 });
  expect(dayCells(weeks).every((cell) => cell.mark.kind === "available")).toBe(
    true,
  );

  expect(daysInYearMonth({ year: 2024, month: 11 })).toBe(30);
  expect(daysInYearMonth({ year: 2024, month: 2 })).toBe(29);
  expect(daysInYearMonth({ year: 2025, month: 2 })).toBe(28);
});

function dayCells(
  weeks: readonly (readonly CalendarGridCell[])[],
): readonly Extract<CalendarGridCell, { kind: "day" }>[] {
  return weeks.flatMap((week) =>
    week.filter((cell) => cell.kind === "day"),
  );
}

function markOf(
  weeks: readonly (readonly CalendarGridCell[])[],
  day: number,
): Extract<CalendarGridCell, { kind: "day" }>["mark"] | undefined {
  return dayCells(weeks).find((cell) => cell.day === day)?.mark;
}
