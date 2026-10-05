import type { RejectedBooking } from "../../domain/RejectedBooking";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function filterRejectedBookings(
  items: readonly RejectedBooking[],
  query: string,
): RejectedBooking[] {
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
