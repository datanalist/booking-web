import type { CalendarGridCell } from "./CalendarGridCell";
import type { BookingCalendarGuestTone } from "./bookingCalendarDemo";

/** Край цветной плашки брони внутри одной недели. */
export type BookingPillEdge = "none" | "solo" | "start" | "middle" | "end";

function bookedTone(
  cell: CalendarGridCell | undefined,
): BookingCalendarGuestTone | null {
  if (cell === undefined || cell.kind !== "day" || cell.mark.kind !== "booked") {
    return null;
  }
  return cell.mark.tone;
}

export function bookingPillEdge(
  week: readonly CalendarGridCell[],
  index: number,
): BookingPillEdge {
  const tone = bookedTone(week[index]);
  if (tone === null) {
    return "none";
  }
  const prevSame = bookedTone(week[index - 1]) === tone;
  const nextSame = bookedTone(week[index + 1]) === tone;
  if (prevSame && nextSame) {
    return "middle";
  }
  if (prevSame) {
    return "end";
  }
  if (nextSame) {
    return "start";
  }
  return "solo";
}
