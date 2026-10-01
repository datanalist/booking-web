export type IsoDate = string & { readonly __brand: "IsoDate" };

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `YYYY-MM-DD` into a real calendar date; throws on malformed or non-existent dates. */
export function parseIsoDate(value: string): IsoDate {
  const match = ISO_DATE_PATTERN.exec(value);
  if (match === null) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  const [, year, month, day] = match;
  const probe = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (probe.toISOString().slice(0, 10) !== value) {
    throw new Error(`Non-existent calendar date: ${value}`);
  }
  // Safe: format and calendar existence were verified above.
  return value as IsoDate;
}
