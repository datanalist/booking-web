import type { IsoDate } from "../../lib/isoDate";
import type { BookingDayOverrides } from "./BookingDayOverrides";
import type {
  BookingCalendarMonthMarks,
  BookingCalendarRange,
} from "./bookingCalendarDemo";
import type { CalendarDayMark } from "./CalendarDayMark";
import { toIsoDate } from "./toIsoDate";
import type { YearMonth } from "./YearMonth";

/** Статус дня: бронь важнее ручной блокировки, блокировка действует в любом месяце. */
export function resolveCalendarDayMark(
  month: YearMonth,
  day: number,
  marks: BookingCalendarMonthMarks,
  overrides: BookingDayOverrides,
): CalendarDayMark {
  const range = bookedRange(month, day, marks);
  if (range !== undefined) {
    return { kind: "booked", tone: range.tone };
  }
  const date = toIsoDate(month, day);
  if (date !== null && overrides.blocked.has(date)) {
    return { kind: "unavailable" };
  }
  if (isDemoUnavailable(month, day, marks, date, overrides)) {
    return { kind: "unavailable" };
  }
  return { kind: "available" };
}

function bookedRange(
  month: YearMonth,
  day: number,
  marks: BookingCalendarMonthMarks,
): BookingCalendarRange | undefined {
  if (month.year !== marks.year || month.month !== marks.month) {
    return undefined;
  }
  return marks.ranges.find((item) => day >= item.fromDay && day <= item.toDay);
}

function isDemoUnavailable(
  month: YearMonth,
  day: number,
  marks: BookingCalendarMonthMarks,
  date: IsoDate | null,
  overrides: BookingDayOverrides,
): boolean {
  if (month.year !== marks.year || month.month !== marks.month) {
    return false;
  }
  if (!marks.unavailableDays.includes(day)) {
    return false;
  }
  return date === null || !overrides.released.has(date);
}
