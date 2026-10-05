import type { BookingStay } from "./BookingStay";
import type { IsoDate } from "./IsoDate";
import { isoDateParts } from "./isoDateParts";

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDate(date: IsoDate): string {
  const { year, month, day } = isoDateParts(date);
  return `${twoDigits(day)}.${twoDigits(month)}.${twoDigits(year % 100)}`;
}

/** Table format: "14.11.24-19.11.24". */
export function formatStayTable(stay: BookingStay): string {
  return `${formatDate(stay.checkIn)}-${formatDate(stay.checkOut)}`;
}
