import type { IsoDate } from "../../lib/isoDate";
import type { BookingDayOverrides } from "./BookingDayOverrides";

/** Переключает незабронированный день: доступен ↔ недоступен. */
export function toggleBookingDayAvailability(
  overrides: BookingDayOverrides,
  date: IsoDate,
  current: "available" | "unavailable",
): BookingDayOverrides {
  const blocked = new Set(overrides.blocked);
  const released = new Set(overrides.released);
  if (current === "available") {
    blocked.add(date);
    released.delete(date);
    return { blocked, released };
  }
  blocked.delete(date);
  released.add(date);
  return { blocked, released };
}
