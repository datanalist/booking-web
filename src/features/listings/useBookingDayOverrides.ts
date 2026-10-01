import { useEffect, useState } from "react";
import type { IsoDate } from "../../lib/isoDate";
import type { BookingDayOverrides } from "./BookingDayOverrides";
import { readBookingDayOverrides } from "./readBookingDayOverrides";
import { toggleBookingDayAvailability } from "./toggleBookingDayAvailability";
import { writeBookingDayOverrides } from "./writeBookingDayOverrides";

/** Блокировки объявления: живут в состоянии и переживают перезагрузку в Storage. */
export function useBookingDayOverrides(
  listingId: string,
  storage: Storage,
): {
  overrides: BookingDayOverrides;
  toggleDay: (date: IsoDate, current: "available" | "unavailable") => void;
} {
  const [overrides, setOverrides] = useState(() =>
    readBookingDayOverrides(storage, listingId),
  );

  useEffect(() => {
    setOverrides(readBookingDayOverrides(storage, listingId));
  }, [listingId, storage]);

  function toggleDay(
    date: IsoDate,
    current: "available" | "unavailable",
  ): void {
    const next = toggleBookingDayAvailability(overrides, date, current);
    writeBookingDayOverrides(storage, listingId, next);
    setOverrides(next);
  }

  return { overrides, toggleDay };
}
