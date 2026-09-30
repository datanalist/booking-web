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

/**
 * Отметки декабря 2024 с макета: брони 5–10, 13–14, 21–23
 * и недоступные 16–18, 27–31. Другие месяцы отметок не имеют.
 */
export const BOOKING_CALENDAR_MONTH_MARKS: BookingCalendarMonthMarks = {
  year: 2024,
  month: 12,
  unavailableDays: [16, 17, 18, 27, 28, 29, 30, 31],
  ranges: [
    { fromDay: 5, toDay: 10, tone: "purple" },
    { fromDay: 13, toDay: 14, tone: "green" },
    { fromDay: 21, toDay: 23, tone: "blue" },
  ],
};

/** Демо-данные алерта по макету Figma 1:22281. */
export const BOOKING_CALENDAR_DEMO: BookingCalendarDemo = {
  listingTitle: "Уютная студия в центре Москвы",
  listingAddress: "Москва, ул. Невская 48",
  listingCoverUrl: "/listings/cover-studio.jpg",
  guests: [
    {
      id: "anna",
      name: "Анна Иваненко",
      phone: "+7 (900) 123-45-67",
      dates: "5-10 декабря",
      nights: "5 ночей",
      avatarUrl: "/avatar-placeholder.png",
      tone: "purple",
    },
    {
      id: "leonid",
      name: "Леонид Фролов",
      phone: "+7 (900) 123-45-67",
      dates: "13-14 декабря",
      nights: "1 ночь",
      avatarUrl: "/avatar-placeholder.png",
      tone: "green",
    },
    {
      id: "alexandra",
      name: "Александра Павловская",
      phone: "+7 (900) 123-45-67",
      dates: "21-23 декабря",
      nights: "2 ночи",
      avatarUrl: "/avatar-placeholder.png",
      tone: "blue",
    },
  ],
};
