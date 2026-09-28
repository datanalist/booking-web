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

export type BookingCalendarDemo = {
  monthLabel: string;
  selectedDayLabel: string;
  listingTitle: string;
  listingAddress: string;
  listingCoverUrl: string;
  guests: readonly BookingCalendarGuest[];
};

/** Демо-данные алерта по макету Figma 1:22281. */
export const BOOKING_CALENDAR_DEMO: BookingCalendarDemo = {
  monthLabel: "Декабрь 2024",
  selectedDayLabel: "15 декабря",
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
