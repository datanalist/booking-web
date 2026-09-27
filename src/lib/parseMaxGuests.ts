/** Допустимое число гостей: ≥1 если разрешены, ровно 0 если запрещены. */
export type MaxGuestsCount = number & { readonly __brand: unique symbol };

export function parseMaxGuests(
  value: number,
  guestsForbidden: boolean,
): MaxGuestsCount | null {
  if (!Number.isFinite(value)) {
    return null;
  }
  if (guestsForbidden) {
    return value === 0 ? (0 as MaxGuestsCount) : null;
  }
  return value >= 1 ? (value as MaxGuestsCount) : null;
}
