import { rub } from "../../../../lib/money";
import type { CancelledBooking } from "./CancelledBooking";

const PHONE = "+7 (900) 123-45-67";
const DATES = "14.11.24-19.11.24";
const PRICE = rub(15_460);
const GUEST_AVATAR = "/bookings/guest-avatar.png";
const HOUSING_STUDIO = "/bookings/housing-studio.jpg";
const HOUSING_HOUSE = "/bookings/housing-house.jpg";
const HOUSING_APARTMENT = "/bookings/housing-apartment.jpg";

export const CANCELLED_BOOKINGS_MOCK: readonly CancelledBooking[] = [
  {
    id: "cancelled-1",
    guestName: "Иваненко Анна",
    guestPhone: PHONE,
    guestAvatarUrl: GUEST_AVATAR,
    housingTitle: "Уютная студия в центре Москвы",
    housingAddress: "Москва, ул. Невская 48",
    housingPhotoUrl: HOUSING_STUDIO,
    datesLabel: DATES,
    price: PRICE,
  },
  {
    id: "cancelled-2",
    guestName: "Ковалев Леонид",
    guestPhone: PHONE,
    guestAvatarUrl: GUEST_AVATAR,
    housingTitle: "Частный дом в 10 км от Москвы",
    housingAddress: "Лесной, ул. Летняя 3",
    housingPhotoUrl: HOUSING_HOUSE,
    datesLabel: DATES,
    price: PRICE,
  },
  {
    id: "cancelled-3",
    guestName: "Полякова Кристина",
    guestPhone: PHONE,
    guestAvatarUrl: GUEST_AVATAR,
    housingTitle: "Частный дом в 10 км от Москвы",
    housingAddress: "Лесной, ул. Летняя 3",
    housingPhotoUrl: HOUSING_HOUSE,
    datesLabel: DATES,
    price: PRICE,
  },
  {
    id: "cancelled-4",
    guestName: "Петров Иван",
    guestPhone: PHONE,
    guestAvatarUrl: GUEST_AVATAR,
    housingTitle: "Уютная студия в центре Москвы",
    housingAddress: "Москва, ул. Невская 48",
    housingPhotoUrl: HOUSING_STUDIO,
    datesLabel: DATES,
    price: PRICE,
  },
  {
    id: "cancelled-5",
    guestName: "Симонов Степан",
    guestPhone: PHONE,
    guestAvatarUrl: GUEST_AVATAR,
    housingTitle: "Квартира в старом городе",
    housingAddress: "Москва, ул. Невская 48",
    housingPhotoUrl: HOUSING_APARTMENT,
    datesLabel: DATES,
    price: PRICE,
  },
];
