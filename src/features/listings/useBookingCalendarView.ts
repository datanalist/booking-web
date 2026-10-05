import { useEffect, useRef, useState } from "react";
import type { BookingCalendarView } from "./BookingCalendarView";
import { initialBookingCalendarView } from "./initialBookingCalendarView";
import { shiftBookingCalendarView } from "./shiftBookingCalendarView";

/** Выбранные месяц и день: при каждом открытии алерта сбрасываются на `today`. */
export function useBookingCalendarView(
  open: boolean,
  today: Date,
): {
  view: BookingCalendarView;
  selectDay: (day: number) => void;
  shiftMonth: (delta: -1 | 1) => void;
} {
  const [view, setView] = useState(() => initialBookingCalendarView(today));
  const todayRef = useRef(today);
  todayRef.current = today;
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setView(initialBookingCalendarView(todayRef.current));
    }
    wasOpen.current = open;
  }, [open]);

  function selectDay(day: number): void {
    setView((current) => ({ month: current.month, selectedDay: day }));
  }

  function shiftMonth(delta: -1 | 1): void {
    setView((current) => shiftBookingCalendarView(current, delta));
  }

  return { view, selectDay, shiftMonth };
}
