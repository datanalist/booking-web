import type { CalendarGridCell } from "./CalendarGridCell";
import { daysInYearMonth } from "./daysInYearMonth";
import { mondayIndexOfMonthStart } from "./mondayIndexOfMonthStart";
import { resolveCalendarDayMark } from "./resolveCalendarDayMark";
import type { YearMonth } from "./YearMonth";

/** Недели месяца: ведущие пустые ячейки до понедельника и хвост до вс. */
export function buildCalendarWeeks(
  month: YearMonth,
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
      mark: resolveCalendarDayMark(month, day),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: "pad" });
  }
  const weeks: CalendarGridCell[][] = [];
  for (let offset = 0; offset < cells.length; offset += 7) {
    weeks.push(cells.slice(offset, offset + 7));
  }
  return weeks;
}
