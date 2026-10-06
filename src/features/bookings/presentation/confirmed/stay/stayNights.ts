import type { BookingStay } from "./BookingStay";
import { isoDateParts } from "./isoDateParts";

const MS_PER_DAY = 86_400_000;

function utcDay(date: BookingStay["checkIn"]): number {
  const { year, month, day } = isoDateParts(date);
  return Date.UTC(year, month - 1, day);
}

export function stayNights(stay: BookingStay): number {
  return Math.round((utcDay(stay.checkOut) - utcDay(stay.checkIn)) / MS_PER_DAY);
}
