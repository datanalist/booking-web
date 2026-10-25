import { useEffect, useRef, useState } from "react";
import { blockRangesToBookingOverrides } from "../../api/pocketbase";
import type { IsoDate } from "../../lib/isoDate";
import type { BookingDayOverrides } from "./BookingDayOverrides";
import { emptyBookingDayOverrides } from "./BookingDayOverrides";
import {
  createListingCalendarPort,
  type BookingCalendarPort,
} from "./createListingCalendarPort";
import {
  emptyBookingCalendarLoad,
  type BookingCalendarLoad,
} from "./loadBookingCalendar";
import { toggleBookingDayAvailability } from "./toggleBookingDayAvailability";

/** Загрузка календаря объявления и запись переключателя в `listing_blocks`. */
export function useListingCalendar(
  open: boolean,
  listingId: string,
  storage: Storage,
  calendarPort?: BookingCalendarPort,
): {
  load: BookingCalendarLoad;
  overrides: BookingDayOverrides;
  ready: boolean;
  toggleDay: (date: IsoDate, current: "available" | "unavailable") => void;
} {
  const [load, setLoad] = useState<BookingCalendarLoad>(() => emptyBookingCalendarLoad());
  const [overrides, setOverrides] = useState<BookingDayOverrides>(() => emptyBookingDayOverrides());
  const [ready, setReady] = useState(false);
  const overridesRef = useRef(overrides);
  const readyRef = useRef(ready);
  const revision = useRef(0);
  const saveChain = useRef(Promise.resolve());
  const portRef = useRef(calendarPort);
  const storageRef = useRef(storage);
  const listingIdRef = useRef(listingId);
  overridesRef.current = overrides;
  readyRef.current = ready;
  portRef.current = calendarPort;
  storageRef.current = storage;
  listingIdRef.current = listingId;

  function activePort(): BookingCalendarPort {
    return portRef.current ?? createListingCalendarPort(storageRef.current);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    const seen = revision.current;
    readyRef.current = false;
    setReady(false);
    void activePort().load(listingId).then((next) => {
      if (cancelled || revision.current !== seen) {
        return;
      }
      const loadedOverrides = blockRangesToBookingOverrides(next.blocks);
      overridesRef.current = loadedOverrides;
      setLoad(next);
      setOverrides(loadedOverrides);
      readyRef.current = true;
      setReady(true);
    }).catch(() => {
      if (cancelled || revision.current !== seen) {
        return;
      }
      const empty = emptyBookingCalendarLoad();
      overridesRef.current = emptyBookingDayOverrides();
      setLoad(empty);
      setOverrides(overridesRef.current);
      readyRef.current = true;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, listingId, calendarPort, storage]);

  function toggleDay(date: IsoDate, current: "available" | "unavailable"): void {
    if (!readyRef.current) {
      return;
    }
    const listing = listingIdRef.current;
    const next = toggleBookingDayAvailability(overridesRef.current, date, current);
    overridesRef.current = next;
    revision.current += 1;
    const seen = revision.current;
    setOverrides(next);
    const snapshot = next;
    saveChain.current = saveChain.current.catch(() => undefined).then(async () => {
      try {
        await activePort().saveBlocks(listing, snapshot);
      } catch {
        if (revision.current !== seen) {
          return;
        }
        try {
          const fresh = await activePort().load(listing);
          if (revision.current !== seen) {
            return;
          }
          const restored = blockRangesToBookingOverrides(fresh.blocks);
          overridesRef.current = restored;
          setLoad(fresh);
          setOverrides(restored);
        } catch {
          // Сеть недоступна: на экране остаётся последний удачный локальный снимок.
        }
      }
    });
  }

  return { load, overrides, ready, toggleDay };
}
