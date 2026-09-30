export type BookingCalendarGuestTone = "purple" | "green" | "blue";

export type BookingCalendarGuest = {
  id: string;
  name: string;
  phone: string;
  dates: string;
  nights: string;
  avatarUrl: string;
  tone: BookingCalendarGuestTone;
};

export type BookingCalendarRange = {
  readonly fromDay: number;
  readonly toDay: number;
  readonly tone: BookingCalendarGuestTone;
};

export type BookingCalendarMonthMarks = {
  readonly year: number;
  readonly month: number;
  readonly unavailableDays: readonly number[];
  readonly ranges: readonly BookingCalendarRange[];
};

export type BookingCalendarDemo = {
  listingTitle: string;
  listingAddress: string;
  listingCoverUrl: string;
  guests: readonly BookingCalendarGuest[];
};

/** Шаблон гостя: дни месяца общие с отметками сетки, подпись месяца подставляется от «сегодня». */
export type BookingCalendarGuestTemplate = {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly fromDay: number;
  readonly toDay: number;
  readonly nights: string;
  readonly avatarUrl: string;
  readonly tone: BookingCalendarGuestTone;
};

/** Дни броней и блокировок с макета, без привязки к декабрю 2024. */
export const BOOKING_CALENDAR_GUEST_TEMPLATES: readonly BookingCalendarGuestTemplate[] =
  [
    {
      id: "anna",
      name: "Анна Иваненко",
      phone: "+7 (900) 123-45-67",
      fromDay: 5,
      toDay: 10,
      nights: "5 ночей",
      avatarUrl: "/avatar-placeholder.png",
      tone: "purple",
    },
    {
      id: "leonid",
      name: "Леонид Фролов",
      phone: "+7 (900) 123-45-67",
      fromDay: 13,
      toDay: 14,
      nights: "1 ночь",
      avatarUrl: "/avatar-placeholder.png",
      tone: "green",
    },
    {
      id: "alexandra",
      name: "Александра Павловская",
      phone: "+7 (900) 123-45-67",
      fromDay: 21,
      toDay: 23,
      nights: "2 ночи",
      avatarUrl: "/avatar-placeholder.png",
      tone: "blue",
    },
  ];

export const BOOKING_CALENDAR_DEMO_UNAVAILABLE_DAYS: readonly number[] = [
  16, 17, 18, 27, 28, 29, 30, 31,
];
