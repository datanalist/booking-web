import { parseIsoDate, type IsoDate } from "./IsoDate";

export type BookingStay = {
  checkIn: IsoDate;
  checkOut: IsoDate;
};

/** Builds a stay; check-out must be strictly after check-in. */
export function bookingStay(checkIn: string, checkOut: string): BookingStay {
  const stay: BookingStay = {
    checkIn: parseIsoDate(checkIn),
    checkOut: parseIsoDate(checkOut),
  };
  if (stay.checkOut <= stay.checkIn) {
    throw new Error(`Check-out must be after check-in: ${checkIn} - ${checkOut}`);
  }
  return stay;
}
