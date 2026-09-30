import type { Rub } from "../../../../lib/money";

export type CancelledBooking = {
  id: string;
  guestName: string;
  guestPhone: string;
  housingTitle: string;
  housingAddress: string;
  datesLabel: string;
  price: Rub;
};
