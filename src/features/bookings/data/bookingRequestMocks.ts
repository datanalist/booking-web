import {
  bookingRequestId,
  type BookingRequest,
} from "../domain/BookingRequest";

const GUEST_PHONE = "+7 (900) 123-45-67";

export const BOOKING_REQUEST_MOCKS: readonly BookingRequest[] = [
  {
    id: bookingRequestId("req-1"),
    guestName: "Иваненко Анна",
    guestPhone: GUEST_PHONE,
    guestAvatarUrl: "/bookings/guest-anna.jpg",
    listingTitle: "Уютная студия в центре Москвы",
    listingAddress: "Москва, ул. Невская 48",
    listingPhotoUrl: "/bookings/listing-studio.jpg",
    datesLabel: "14.11.24-19.11.24",
    priceLabel: "15 460 ₽",
  },
  {
    id: bookingRequestId("req-2"),
    guestName: "Ковалев Леонид",
    guestPhone: GUEST_PHONE,
    guestAvatarUrl: "/bookings/guest-leonid.jpg",
    listingTitle: "Частный дом в 10 км от Москвы",
    listingAddress: "Лесной, ул. Летняя 3",
    listingPhotoUrl: "/bookings/listing-house.jpg",
    datesLabel: "23.12.24-26.12.24",
    priceLabel: "9 690 ₽",
  },
  {
    id: bookingRequestId("req-3"),
    guestName: "Полякова Кристина",
    guestPhone: GUEST_PHONE,
    guestAvatarUrl: "/bookings/guest-kristina.jpg",
    listingTitle: "Уютная студия в центре Москвы",
    listingAddress: "Москва, ул. Невская 48",
    listingPhotoUrl: "/bookings/listing-studio.jpg",
    datesLabel: "24.12.24-03.01.25",
    priceLabel: "31 120 ₽",
  },
];
