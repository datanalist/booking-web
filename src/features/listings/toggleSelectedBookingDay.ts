import type { IsoDate } from "../../lib/isoDate";
import type { BookingCalendarMonthMarks } from "./bookingCalendarDemo";
import type { BookingDayOverrides } from "./BookingDayOverrides";
import type { BookingCalendarView } from "./BookingCalendarView";
import { resolveCalendarDayMark } from "./resolveCalendarDayMark";
import { toIsoDate } from "./toIsoDate";

/** Переключает выбранный день, если он не забронирован. */
export function toggleSelectedBookingDay(
  view: BookingCalendarView,
  marks: BookingCalendarMonthMarks,
  overrides: BookingDayOverrides,
  toggleDay: (date: IsoDate, current: "available" | "unavailable") => void,
): void {
  const date = toIsoDate(view.month, view.selectedDay);
  if (date === null) {
    return;
  }
  const mark = resolveCalendarDayMark(
    view.month,
    view.selectedDay,
    marks,
    overrides,
  );
  if (mark.kind === "booked") {
    return;
  }
  toggleDay(date, mark.kind);
}
