import type { BookingStay } from "./BookingStay";
import { isoDateParts } from "./isoDateParts";

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

function monthName(month: number): string {
  return MONTHS_GENITIVE[month - 1] ?? "";
}

/** "5-10 декабря" within one month, "28 ноября - 2 декабря" across months. */
export function formatStayLong(stay: BookingStay): string {
  const from = isoDateParts(stay.checkIn);
  const to = isoDateParts(stay.checkOut);
  if (from.year === to.year && from.month === to.month) {
    return `${from.day}-${to.day} ${monthName(to.month)}`;
  }
  return `${from.day} ${monthName(from.month)} - ${to.day} ${monthName(to.month)}`;
}
