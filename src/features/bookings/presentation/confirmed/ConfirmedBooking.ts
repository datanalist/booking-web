import type { ConfirmedBookingId } from "./ConfirmedBookingId";
import type { ConfirmedBookingStatus } from "./confirmedBookingStatus";
import type { BookingStay } from "./stay/BookingStay";

export type ConfirmedBooking = {
  id: ConfirmedBookingId;
  guestName: string;
  guestPhone: string;
  guestAvatarUrl: string;
  housingTitle: string;
  housingAddress: string;
  housingPhotoUrl: string;
  stay: BookingStay;
  priceLabel: string;
  status: ConfirmedBookingStatus;
};
