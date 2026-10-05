/** Ключ localStorage для ручных блокировок одного объявления. */
export function bookingCalendarBlocksKey(listingId: string): string {
  return `booking-calendar-blocks:${listingId}`;
}
