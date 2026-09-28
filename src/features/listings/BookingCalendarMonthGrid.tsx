import type { ReactElement } from "react";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

type DayCell = {
  day: number | null;
  unavailable?: boolean;
};

/** Статическая сетка декабря из макета Figma 1:22281. */
const WEEKS: readonly (readonly DayCell[])[] = [
  [
    { day: null },
    { day: null },
    { day: null },
    { day: 1 },
    { day: 2 },
    { day: 3 },
    { day: 4 },
  ],
  [
    { day: 5 },
    { day: 6 },
    { day: 7 },
    { day: 8 },
    { day: 9 },
    { day: 10 },
    { day: 11 },
  ],
  [
    { day: 12 },
    { day: 13 },
    { day: 14 },
    { day: 15 },
    { day: 16, unavailable: true },
    { day: 17, unavailable: true },
    { day: 18, unavailable: true },
  ],
  [
    { day: 19 },
    { day: 20 },
    { day: 21 },
    { day: 22 },
    { day: 23 },
    { day: 24 },
    { day: 25 },
  ],
  [
    { day: 26 },
    { day: 27, unavailable: true },
    { day: 28, unavailable: true },
    { day: 29, unavailable: true },
    { day: 30, unavailable: true },
    { day: 31, unavailable: true },
    { day: null },
  ],
];

/** Сетка дней и подсветки диапазонов бронирований. */
export function BookingCalendarMonthGrid(): ReactElement {
  return (
    <div className="relative flex w-[360px] flex-col items-center gap-8">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-8px] top-[104px] h-9 w-[323px] rounded-[40px] bg-[rgba(77,56,232,0.23)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[44px] top-[159px] h-9 w-[108px] rounded-[40px] bg-[rgba(47,235,39,0.3)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[162px] top-[159px] size-9 rounded-full border border-solid border-[#1a1b1d]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[96px] top-[214px] h-9 w-[167px] rounded-[40px] bg-[rgba(91,197,242,0.3)]"
      />
      <WeekdayRow />
      {WEEKS.map((week, weekIndex) => (
        <WeekRow key={weekIndex} week={week} weekIndex={weekIndex} />
      ))}
    </div>
  );
}

function WeekdayRow(): ReactElement {
  return (
    <div className="flex w-full items-center justify-between text-center text-[16px] font-normal text-[#525353]">
      {WEEKDAYS.map((day) => (
        <span key={day} className="leading-[1.45]">
          {day}
        </span>
      ))}
    </div>
  );
}

function WeekRow({
  week,
  weekIndex,
}: {
  week: readonly DayCell[];
  weekIndex: number;
}): ReactElement {
  return (
    <div className="relative z-[1] flex w-full items-center justify-between text-center text-[16px] font-normal">
      {week.map((cell, dayIndex) => (
        <DayLabel key={`${weekIndex}-${dayIndex}`} cell={cell} />
      ))}
    </div>
  );
}

function DayLabel({ cell }: { cell: DayCell }): ReactElement {
  if (cell.day === null) {
    return <span className="w-[21px]" />;
  }

  return (
    <span
      className={`w-[21px] leading-[1.45] ${
        cell.unavailable ? "text-[#525353] line-through" : "text-[#1a1b1d]"
      }`}
    >
      {cell.day}
    </span>
  );
}
