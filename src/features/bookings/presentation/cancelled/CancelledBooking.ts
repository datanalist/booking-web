import type { Rub } from "../../../../lib/money";

export type CancelledBooking = {
  id: string;
  guestName: string;
  guestPhone: string;
  guestAvatarUrl: string;
  housingTitle: string;
  housingAddress: string;
  housingPhotoUrl: string;
  datesLabel: string;
  price: Rub;
};
