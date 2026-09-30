import type { ReactElement } from "react";
import { bookingPillEdge } from "./bookingPillEdge";
import { BookingCalendarDayButton } from "./BookingCalendarDayButton";
import type { CalendarGridCell } from "./CalendarGridCell";
import { formatCalendarDayLabel } from "./formatCalendarDayLabel";
import type { YearMonth } from "./YearMonth";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

type BookingCalendarMonthGridProps = {
  month: YearMonth;
  weeks: readonly (readonly CalendarGridCell[])[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
};

/** Сетка дней выбранного месяца. */
export function BookingCalendarMonthGrid({
  month,
  weeks,
  selectedDay,
  onSelectDay,
}: BookingCalendarMonthGridProps): ReactElement {
  return (
    <div className="flex w-[360px] flex-col gap-8">
      <WeekdayRow />
      {weeks.map((week, weekIndex) => (
        <WeekRow
          key={weekKey(week, weekIndex)}
          month={month}
          week={week}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
        />
      ))}
    </div>
  );
}

function WeekdayRow(): ReactElement {
  return (
    <div className="grid grid-cols-7 text-center text-[16px] font-normal text-[#525353]">
      {WEEKDAYS.map((day) => (
        <span key={day} className="leading-[1.45]">
          {day}
        </span>
      ))}
    </div>
  );
}

function WeekRow({
  month,
  week,
  selectedDay,
  onSelectDay,
}: {
  month: YearMonth;
  week: readonly CalendarGridCell[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}): ReactElement {
  return (
    <div className="grid grid-cols-7">
      {week.map((cell, index) => (
        <GridCell
          key={cell.kind === "day" ? cell.day : `pad-${index}`}
          month={month}
          week={week}
          cell={cell}
          index={index}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
        />
      ))}
    </div>
  );
}

function GridCell({
  month,
  week,
  cell,
  index,
  selectedDay,
  onSelectDay,
}: {
  month: YearMonth;
  week: readonly CalendarGridCell[];
  cell: CalendarGridCell;
  index: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
}): ReactElement {
  if (cell.kind === "pad") {
    return <span data-calendar-cell="" className="h-9" />;
  }
  return (
    <BookingCalendarDayButton
      day={cell.day}
      label={formatCalendarDayLabel(month, cell.day)}
      mark={cell.mark}
      edge={bookingPillEdge(week, index)}
      selected={cell.day === selectedDay}
      onSelect={() => onSelectDay(cell.day)}
    />
  );
}

function weekKey(week: readonly CalendarGridCell[], weekIndex: number): string {
  const firstDay = week.find((cell) => cell.kind === "day");
  if (firstDay === undefined || firstDay.kind !== "day") {
    return `week-${weekIndex}`;
  }
  return `week-${firstDay.day}`;
}
