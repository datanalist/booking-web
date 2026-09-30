function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function matchesGuestQuery(
  guestName: string,
  guestPhone: string,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (guestName.toLowerCase().includes(normalized)) {
    return true;
  }

  const queryDigits = digitsOnly(normalized);
  if (queryDigits.length === 0) {
    return false;
  }

  return digitsOnly(guestPhone).includes(queryDigits);
}
