import type { BookingCalendarView } from "./BookingCalendarView";

/** Месяц и день открытия календаря — календарная дата `today`, без времени. */
export function initialBookingCalendarView(today: Date): BookingCalendarView {
  return {
    month: { year: today.getFullYear(), month: today.getMonth() + 1 },
    selectedDay: today.getDate(),
  };
}
