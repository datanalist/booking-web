import type { ConfirmedBookingStatus } from "./confirmedBookingStatus";

export type ConfirmedBooking = {
  id: string;
  guestName: string;
  guestPhone: string;
  guestAvatarUrl: string;
  housingTitle: string;
  housingAddress: string;
  housingPhotoUrl: string;
  datesLabel: string;
  priceLabel: string;
  status: ConfirmedBookingStatus;
};
