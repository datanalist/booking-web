import {
  rejectedBookingId,
  type RejectedBooking,
} from "../domain/RejectedBooking";

const GUEST_PHONE = "+7 (900) 123-45-67";
const DATES_LABEL = "14.11.24-19.11.24";
const PRICE_LABEL = "15 460 ₽";

export const REJECTED_BOOKING_MOCKS: readonly RejectedBooking[] = [
  {
    id: rejectedBookingId("rej-1"),
    guestName: "Иваненко Анна",
    guestPhone: GUEST_PHONE,
    guestAvatarUrl: "/avatar-placeholder.png",
    listingTitle: "Уютная студия в центре Москвы",
    listingAddress: "Москва, ул. Невская 48",
    listingPhotoUrl: "/booking-listing-studio.svg",
    datesLabel: DATES_LABEL,
    priceLabel: PRICE_LABEL,
  },
  {
    id: rejectedBookingId("rej-2"),
    guestName: "Ковалев Леонид",
    guestPhone: GUEST_PHONE,
    guestAvatarUrl: "/avatar-placeholder.png",
    listingTitle: "Частный дом в 10 км от Москвы",
    listingAddress: "Лесной, ул. Летняя 3",
    listingPhotoUrl: "/booking-listing-house.svg",
    datesLabel: DATES_LABEL,
    priceLabel: PRICE_LABEL,
  },
  {
    id: rejectedBookingId("rej-3"),
    guestName: "Полякова Кристина",
    guestPhone: GUEST_PHONE,
    guestAvatarUrl: "/avatar-placeholder.png",
    listingTitle: "Частный дом в 10 км от Москвы",
    listingAddress: "Лесной, ул. Летняя 3",
    listingPhotoUrl: "/booking-listing-house.svg",
    datesLabel: DATES_LABEL,
    priceLabel: PRICE_LABEL,
  },
  {
    id: rejectedBookingId("rej-4"),
    guestName: "Петров Иван",
    guestPhone: GUEST_PHONE,
    guestAvatarUrl: "/avatar-placeholder.png",
    listingTitle: "Уютная студия в центре Москвы",
    listingAddress: "Москва, ул. Невская 48",
    listingPhotoUrl: "/booking-listing-studio.svg",
    datesLabel: DATES_LABEL,
    priceLabel: PRICE_LABEL,
  },
  {
    id: rejectedBookingId("rej-5"),
    guestName: "Симонов Степан",
    guestPhone: GUEST_PHONE,
    guestAvatarUrl: "/avatar-placeholder.png",
    listingTitle: "Квартира в старом городе",
    listingAddress: "Москва, ул. Невская 48",
    listingPhotoUrl: "/booking-listing-apartment.svg",
    datesLabel: DATES_LABEL,
    priceLabel: PRICE_LABEL,
  },
];
