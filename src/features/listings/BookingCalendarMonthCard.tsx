import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";
import { BookingCalendarAvailabilityToggle } from "./BookingCalendarAvailabilityToggle";
import { BookingCalendarMonthGrid } from "./BookingCalendarMonthGrid";
import type { BookingCalendarView } from "./BookingCalendarView";
import { buildCalendarWeeks } from "./buildCalendarWeeks";
import { formatCalendarDayLabel } from "./formatCalendarDayLabel";
import { formatYearMonthLabel } from "./formatYearMonthLabel";

type BookingCalendarMonthCardProps = {
  view: BookingCalendarView;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

/** Карточка месяца, сетки дней и подписи выбранной даты (Figma 1:22281). */
export function BookingCalendarMonthCard({
  view,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: BookingCalendarMonthCardProps): ReactElement {
  const weeks = buildCalendarWeeks(view.month);
  return (
    <div className="flex flex-col gap-10 rounded-2xl border border-solid border-[rgba(251,192,40,0.17)] bg-white p-6">
      <MonthHeader
        monthLabel={formatYearMonthLabel(view.month)}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
      <BookingCalendarMonthGrid
        month={view.month}
        weeks={weeks}
        selectedDay={view.selectedDay}
        onSelectDay={onSelectDay}
      />
      <SelectedDayCaption
        label={formatCalendarDayLabel(view.month, view.selectedDay)}
      />
    </div>
  );
}

function MonthHeader({
  monthLabel,
  onPrevMonth,
  onNextMonth,
}: {
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}): ReactElement {
  return (
    <div className="flex w-[360px] items-center justify-between">
      <p className="m-0 text-center text-[16px] font-bold leading-[1.2] text-[#1a1b1d]">
        {monthLabel}
      </p>
      <div className="flex items-center gap-4">
        <MonthNavButton label="Предыдущий месяц" onClick={onPrevMonth}>
          <ChevronLeft aria-hidden className="size-6" strokeWidth={1.5} />
        </MonthNavButton>
        <MonthNavButton label="Следующий месяц" onClick={onNextMonth}>
          <ChevronRight aria-hidden className="size-6" strokeWidth={1.5} />
        </MonthNavButton>
      </div>
    </div>
  );
}

function SelectedDayCaption({ label }: { label: string }): ReactElement {
  return (
    <div className="flex w-full flex-col gap-1">
      <p className="m-0 text-[14px] font-bold leading-[1.4] text-[#1a1b1d]">
        {label}
      </p>
      <div className="flex w-full items-center justify-between">
        <p className="m-0 text-center text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          доступно для бронирования
        </p>
        <BookingCalendarAvailabilityToggle />
      </div>
    </div>
  );
}

function MonthNavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactElement;
}): ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex cursor-pointer items-center justify-center rounded-[30px] border border-solid border-[#ffe4b8] bg-white p-2"
    >
      {children}
    </button>
  );
}
