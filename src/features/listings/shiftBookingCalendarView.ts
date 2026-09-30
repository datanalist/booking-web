import { daysInYearMonth } from "./daysInYearMonth";
import { shiftYearMonth } from "./shiftYearMonth";
import type { BookingCalendarView } from "./BookingCalendarView";

/** Сдвигает месяц и оставляет выбранный день, если он есть в новом месяце. */
export function shiftBookingCalendarView(
  view: BookingCalendarView,
  delta: -1 | 1,
): BookingCalendarView {
  const month = shiftYearMonth(view.month, delta);
  const lastDay = daysInYearMonth(month);
  const selectedDay = view.selectedDay > lastDay ? lastDay : view.selectedDay;
  return { month, selectedDay };
}
