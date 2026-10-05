import { parseIsoDate, type IsoDate } from "../../lib/isoDate";
import {
  emptyBookingDayOverrides,
  type BookingDayOverrides,
} from "./BookingDayOverrides";

/** Разбирает JSON блокировок. Мусор и не-даты отбрасываются, без слепых кастов. */
export function parseBookingDayOverrides(raw: string): BookingDayOverrides {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return emptyBookingDayOverrides();
  }
  if (!isRecord(value)) {
    return emptyBookingDayOverrides();
  }
  return {
    blocked: isoDateSet(value.blocked),
    released: isoDateSet(value.released),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isoDateSet(value: unknown): ReadonlySet<IsoDate> {
  if (!Array.isArray(value)) {
    return new Set();
  }
  const dates = new Set<IsoDate>();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const date = parseIsoDate(item);
    if (date !== null) {
      dates.add(date);
    }
  }
  return dates;
}
