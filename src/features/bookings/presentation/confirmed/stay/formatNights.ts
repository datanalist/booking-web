/** Russian plural: 1 ночь, 2-4 ночи, 5+ ночей. */
export function formatNights(nights: number): string {
  const lastTwo = nights % 100;
  const last = nights % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${nights} ночей`;
  }
  if (last === 1) {
    return `${nights} ночь`;
  }
  if (last >= 2 && last <= 4) {
    return `${nights} ночи`;
  }
  return `${nights} ночей`;
}
