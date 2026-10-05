import type { BookingRequest } from "../../domain/BookingRequest";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function filterBookingRequests(
  items: readonly BookingRequest[],
  query: string,
): BookingRequest[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...items];
  }

  const queryDigits = digitsOnly(normalized);

  return items.filter((item) => {
    const nameMatch = item.guestName.toLowerCase().includes(normalized);
    const phoneMatch =
      queryDigits.length > 0 &&
      digitsOnly(item.guestPhone).includes(queryDigits);
    return nameMatch || phoneMatch;
  });
}
