import { rub } from "../../../../lib/money";
import type { CancelledBooking } from "./CancelledBooking";

const PHONE = "+7 (900) 123-45-67";
const DATES = "14.11.24-19.11.24";
const PRICE = rub(15_460);

export const CANCELLED_BOOKINGS_MOCK: readonly CancelledBooking[] = [
  {
    id: "cancelled-1",
    guestName: "Иваненко Анна",
    guestPhone: PHONE,
    housingTitle: "Уютная студия в центре Москвы",
    housingAddress: "Москва, ул. Невская 48",
    datesLabel: DATES,
    price: PRICE,
  },
  {
    id: "cancelled-2",
    guestName: "Ковалев Леонид",
    guestPhone: PHONE,
    housingTitle: "Частный дом в 10 км от Москвы",
    housingAddress: "Лесной, ул. Летняя 3",
    datesLabel: DATES,
    price: PRICE,
  },
  {
    id: "cancelled-3",
    guestName: "Полякова Кристина",
    guestPhone: PHONE,
    housingTitle: "Частный дом в 10 км от Москвы",
    housingAddress: "Лесной, ул. Летняя 3",
    datesLabel: DATES,
    price: PRICE,
  },
  {
    id: "cancelled-4",
    guestName: "Петров Иван",
    guestPhone: PHONE,
    housingTitle: "Уютная студия в центре Москвы",
    housingAddress: "Москва, ул. Невская 48",
    datesLabel: DATES,
    price: PRICE,
  },
  {
    id: "cancelled-5",
    guestName: "Симонов Степан",
    guestPhone: PHONE,
    housingTitle: "Квартира в старом городе",
    housingAddress: "Москва, ул. Невская 48",
    datesLabel: DATES,
    price: PRICE,
  },
];
