import type { BookingCalendarMonthMarks } from "./bookingCalendarDemo";
import type { CalendarGridCell } from "./CalendarGridCell";
import { daysInYearMonth } from "./daysInYearMonth";
import { mondayIndexOfMonthStart } from "./mondayIndexOfMonthStart";
import { resolveCalendarDayMark } from "./resolveCalendarDayMark";
import type { YearMonth } from "./YearMonth";

/** Шесть недель (42 ячейки): пустые дни вне месяца невидимы, высота сетки постоянна. */
export function buildCalendarWeeks(
  month: YearMonth,
  marks: BookingCalendarMonthMarks,
): readonly (readonly CalendarGridCell[])[] {
  const cells: CalendarGridCell[] = [];
  const leading = mondayIndexOfMonthStart(month);
  for (let index = 0; index < leading; index += 1) {
    cells.push({ kind: "pad" });
  }
  const count = daysInYearMonth(month);
  for (let day = 1; day <= count; day += 1) {
    cells.push({
      kind: "day",
      day,
      mark: resolveCalendarDayMark(month, day, marks),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: "pad" });
  }
  const weeks: CalendarGridCell[][] = [];
  for (let offset = 0; offset < cells.length; offset += 7) {
    weeks.push(cells.slice(offset, offset + 7));
  }
  while (weeks.length < 6) {
    weeks.push(emptyCalendarWeek());
  }
  return weeks;
}

function emptyCalendarWeek(): CalendarGridCell[] {
  return Array.from({ length: 7 }, () => ({ kind: "pad" }));
}
