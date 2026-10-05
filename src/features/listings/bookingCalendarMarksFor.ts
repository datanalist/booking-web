import {
  BOOKING_CALENDAR_DEMO_UNAVAILABLE_DAYS,
  BOOKING_CALENDAR_GUEST_TEMPLATES,
  type BookingCalendarMonthMarks,
} from "./bookingCalendarDemo";
import { daysInYearMonth } from "./daysInYearMonth";
import type { YearMonth } from "./YearMonth";

/** Демо-отметки месяца, в котором лежит `today`. Дни за пределом месяца отбрасываются. */
export function bookingCalendarMarksFor(today: Date): BookingCalendarMonthMarks {
  const month = yearMonthOf(today);
  const lastDay = daysInYearMonth(month);
  return {
    year: month.year,
    month: month.month,
    unavailableDays: BOOKING_CALENDAR_DEMO_UNAVAILABLE_DAYS.filter(
      (day) => day <= lastDay,
    ),
    ranges: BOOKING_CALENDAR_GUEST_TEMPLATES.filter(
      (guest) => guest.fromDay <= lastDay,
    ).map((guest) => ({
      fromDay: guest.fromDay,
      toDay: guest.toDay <= lastDay ? guest.toDay : lastDay,
      tone: guest.tone,
    })),
  };
}

function yearMonthOf(today: Date): YearMonth {
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}
