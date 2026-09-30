import type { ReactElement } from "react";
import type { BookingPillEdge } from "./bookingPillEdge";
import type { BookingCalendarGuestTone } from "./bookingCalendarDemo";
import type { CalendarDayMark } from "./CalendarDayMark";

const TONE_CLASS: Record<BookingCalendarGuestTone, string> = {
  purple: "bg-[rgba(77,56,232,0.23)]",
  green: "bg-[rgba(47,235,39,0.3)]",
  blue: "bg-[rgba(91,197,242,0.3)]",
};

const EDGE_RADIUS: Record<BookingPillEdge, string> = {
  none: "",
  solo: "rounded-[40px]",
  start: "rounded-l-[40px]",
  middle: "",
  end: "rounded-r-[40px]",
};

type BookingCalendarDayButtonProps = {
  day: number;
  label: string;
  mark: CalendarDayMark;
  edge: BookingPillEdge;
  selected: boolean;
  onSelect: () => void;
};

/** День сетки: клик выбирает дату, визуальный статус из легенды сохраняется. */
export function BookingCalendarDayButton({
  day,
  label,
  mark,
  edge,
  selected,
  onSelect,
}: BookingCalendarDayButtonProps): ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex h-9 w-full cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[16px] font-normal leading-[1.45] ${daySurfaceClass(mark, edge)} ${dayTextClass(mark)}`}
    >
      {selected ? <SelectedDayRing /> : null}
      {day}
    </button>
  );
}

function SelectedDayRing(): ReactElement {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-solid border-[#1a1b1d]"
    />
  );
}

function daySurfaceClass(mark: CalendarDayMark, edge: BookingPillEdge): string {
  if (mark.kind !== "booked") {
    return "";
  }
  return `${TONE_CLASS[mark.tone]} ${EDGE_RADIUS[edge]}`;
}

function dayTextClass(mark: CalendarDayMark): string {
  if (mark.kind === "unavailable") {
    return "text-[#525353] line-through";
  }
  return "text-[#1a1b1d]";
}
