/**
 * Calendar date as ISO `YYYY-MM-DD`. Prefer `parseIsoDate` so invalid
 * strings cannot enter domain state.
 */
export type IsoDate = string & { readonly __isoDateBrand: unique symbol };

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(raw: string): IsoDate | null {
  const match = ISO_DATE_RE.exec(raw);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  return raw as IsoDate;
}

/** Always `DD.MM.YYYY`, independent of browser locale. */
export function formatIsoDateDisplay(date: IsoDate): string {
  const year = date.slice(0, 4);
  const month = date.slice(5, 7);
  const day = date.slice(8, 10);
  return `${day}.${month}.${year}`;
}
