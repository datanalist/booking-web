import type { BookingCalendarMonthMarks } from "./bookingCalendarDemo";
import type { CalendarDayMark } from "./CalendarDayMark";
import type { YearMonth } from "./YearMonth";

/** Статус дня: демо-брони только у месяца `marks`, иначе день доступен. */
export function resolveCalendarDayMark(
  month: YearMonth,
  day: number,
  marks: BookingCalendarMonthMarks,
): CalendarDayMark {
  if (month.year !== marks.year || month.month !== marks.month) {
    return { kind: "available" };
  }
  const range = marks.ranges.find(
    (item) => day >= item.fromDay && day <= item.toDay,
  );
  if (range !== undefined) {
    return { kind: "booked", tone: range.tone };
  }
  if (marks.unavailableDays.includes(day)) {
    return { kind: "unavailable" };
  }
  return { kind: "available" };
}
