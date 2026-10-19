import type { BookingDayOverrides } from "../../features/listings/BookingDayOverrides";
import { parseIsoDate, type IsoDate } from "../../lib/isoDate";
import type { PbListingBlockRecord, PbOccupiedRange } from "./pbTypes";

const MAX_RANGE_DAYS = 10000;

export function bookingOverridesToBlockRanges(
  overrides: BookingDayOverrides,
): PbOccupiedRange[] {
  const sorted = sortedDays(overrides.blocked);
  const ranges: PbOccupiedRange[] = [];
  let start: IsoDate | null = null;
  let previous: IsoDate | null = null;

  for (const day of sorted) {
    if (start === null || previous === null) {
      start = day;
      previous = day;
      continue;
    }
    if (day === addUtcDays(previous, 1)) {
      previous = day;
      continue;
    }
    ranges.push({ start, end: addUtcDays(previous, 1) });
    start = day;
    previous = day;
  }

  if (start !== null && previous !== null) {
    ranges.push({ start, end: addUtcDays(previous, 1) });
  }
  return ranges;
}

export function blockRangesToBookingOverrides(
  ranges: readonly (PbOccupiedRange | PbListingBlockRecord)[],
): BookingDayOverrides {
  const blocked = new Set<IsoDate>();
  for (const range of ranges) {
    const start = dayKey(range.start);
    const end = dayKey(range.end);
    if (start === null || end === null || start >= end) {
      continue;
    }
    let cursor = start;
    let guard = 0;
    while (cursor < end && guard < MAX_RANGE_DAYS) {
      blocked.add(cursor);
      cursor = addUtcDays(cursor, 1);
      guard += 1;
    }
  }
  return { blocked, released: new Set() };
}

function dayKey(value: string): IsoDate | null {
  const match = /(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  const raw = match?.[1];
  return raw === undefined ? null : parseIsoDate(raw);
}

function sortedDays(days: ReadonlySet<IsoDate>): IsoDate[] {
  const list: IsoDate[] = [];
  for (const day of days) {
    const parsed = parseIsoDate(day);
    if (parsed !== null) {
      list.push(parsed);
    }
  }
  list.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  return list;
}

function addUtcDays(date: IsoDate, days: number): IsoDate {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const parsed = parseIsoDate(utc.toISOString().slice(0, 10));
  if (parsed === null) {
    throw new Error("INVALID_DATE");
  }
  return parsed;
}
