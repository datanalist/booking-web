import { useEffect, useState } from "react";
import {
  bookingCalendarFromBookings,
  EMPTY_LISTING_BOOKING_CALENDAR,
  type ListingBookingCalendarData,
  type ListingBookingCalendarViewModel,
} from "./bookingCalendarFromBookings";
import { loadListingBookingCalendar } from "./loadListingBookingCalendar";
import type { YearMonth } from "./YearMonth";

/** Живой календарь объявления. `null`, пока источник данных — мок. */
export function useListingBookingCalendar(options: {
  useLiveData: boolean;
  open: boolean;
  listingId: string;
  month: YearMonth;
}): ListingBookingCalendarViewModel | null {
  const { useLiveData, open, listingId, month } = options;
  const [loaded, setLoaded] = useState<{
    listingId: string;
    data: ListingBookingCalendarData;
  } | null>(null);

  useEffect(() => {
    if (!useLiveData || !open) {
      return;
    }
    let cancelled = false;
    void loadListingBookingCalendar(listingId)
      .then((data) => {
        if (!cancelled) {
          setLoaded({ listingId, data });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ listingId, data: EMPTY_LISTING_BOOKING_CALENDAR });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [useLiveData, open, listingId]);

  if (!useLiveData) {
    return null;
  }
  const data = loaded?.listingId === listingId ? loaded.data : EMPTY_LISTING_BOOKING_CALENDAR;
  return bookingCalendarFromBookings(data, month);
}
