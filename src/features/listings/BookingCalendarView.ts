import type { YearMonth } from "./YearMonth";

/** Открытый месяц и выбранный день календаря бронирования. */
export type BookingCalendarView = {
  readonly month: YearMonth;
  readonly selectedDay: number;
};

/** Декабрь 2024 и 15-е число — стартовое состояние макета Figma 1:22281. */
export const INITIAL_BOOKING_CALENDAR_VIEW: BookingCalendarView = {
  month: { year: 2024, month: 12 },
  selectedDay: 15,
};
