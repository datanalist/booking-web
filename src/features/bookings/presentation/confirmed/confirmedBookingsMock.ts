import type { ConfirmedBooking } from "./ConfirmedBooking";

const PHONE = "+7 (900) 123-45-67";
const DATES = "14.11.24-19.11.24";
const PRICE = "15 460 ₽";
const STUDIO = {
  title: "Уютная студия в центре Москвы",
  address: "Москва, ул. Невская 48",
  photoUrl: "https://placehold.co/48x48/f5d0a9/1a1b1d?text=1",
} as const;
const HOUSE = {
  title: "Частный дом в 10 км от Москвы",
  address: "Лесной, ул. Летняя 3",
  photoUrl: "https://placehold.co/48x48/c8e0c0/1a1b1d?text=2",
} as const;
const APARTMENT = {
  title: "Квартира в старом городе",
  address: "Москва, ул. Невская 48",
  photoUrl: "https://placehold.co/48x48/c5d4f0/1a1b1d?text=3",
} as const;

export const CONFIRMED_BOOKINGS_MOCK: readonly ConfirmedBooking[] = [
  {
    id: "confirmed-1",
    guestName: "Иваненко Анна",
    guestPhone: PHONE,
    guestAvatarUrl: "https://placehold.co/40x40/e8e8e8/1a1b1d?text=ИА",
    housingTitle: STUDIO.title,
    housingAddress: STUDIO.address,
    housingPhotoUrl: STUDIO.photoUrl,
    datesLabel: DATES,
    priceLabel: PRICE,
    status: {
      kind: "awaitingPrepayment",
      remainingLabel: "осталось 6 часов 30 минут",
    },
  },
  {
    id: "confirmed-2",
    guestName: "Ковалев Леонид",
    guestPhone: PHONE,
    guestAvatarUrl: "https://placehold.co/40x40/e8e8e8/1a1b1d?text=КЛ",
    housingTitle: HOUSE.title,
    housingAddress: HOUSE.address,
    housingPhotoUrl: HOUSE.photoUrl,
    datesLabel: DATES,
    priceLabel: PRICE,
    status: { kind: "prepaymentPaid" },
  },
  {
    id: "confirmed-3",
    guestName: "Полякова Кристина",
    guestPhone: PHONE,
    guestAvatarUrl: "https://placehold.co/40x40/e8e8e8/1a1b1d?text=ПК",
    housingTitle: HOUSE.title,
    housingAddress: HOUSE.address,
    housingPhotoUrl: HOUSE.photoUrl,
    datesLabel: DATES,
    priceLabel: PRICE,
    status: { kind: "request" },
  },
  {
    id: "confirmed-4",
    guestName: "Петров Иван",
    guestPhone: PHONE,
    guestAvatarUrl: "https://placehold.co/40x40/e8e8e8/1a1b1d?text=ПИ",
    housingTitle: STUDIO.title,
    housingAddress: STUDIO.address,
    housingPhotoUrl: STUDIO.photoUrl,
    datesLabel: DATES,
    priceLabel: PRICE,
    status: { kind: "stayCompleted" },
  },
  {
    id: "confirmed-5",
    guestName: "Симонов Степан",
    guestPhone: PHONE,
    guestAvatarUrl: "https://placehold.co/40x40/e8e8e8/1a1b1d?text=СС",
    housingTitle: APARTMENT.title,
    housingAddress: APARTMENT.address,
    housingPhotoUrl: APARTMENT.photoUrl,
    datesLabel: DATES,
    priceLabel: PRICE,
    status: { kind: "staying" },
  },
];
