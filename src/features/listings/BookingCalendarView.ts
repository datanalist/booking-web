import type { YearMonth } from "./YearMonth";

/** Открытый месяц и выбранный день календаря бронирования. */
export type BookingCalendarView = {
  readonly month: YearMonth;
  readonly selectedDay: number;
};
