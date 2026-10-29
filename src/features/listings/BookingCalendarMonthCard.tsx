import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";
import type { BookingDayOverrides } from "./BookingDayOverrides";
import type { BookingCalendarMonthMarks } from "./bookingCalendarDemo";
import { BookingCalendarAvailabilityToggle } from "./BookingCalendarAvailabilityToggle";
import { BookingCalendarMonthGrid } from "./BookingCalendarMonthGrid";
import type { BookingCalendarView } from "./BookingCalendarView";
import { buildCalendarWeeks } from "./buildCalendarWeeks";
import { dayAvailabilityControl } from "./dayAvailabilityControl";
import { formatCalendarDayLabel } from "./formatCalendarDayLabel";
import { formatYearMonthLabel } from "./formatYearMonthLabel";
import { resolveCalendarDayMark } from "./resolveCalendarDayMark";

export type BookingCalendarMonthCardProps = {
  view: BookingCalendarView;
  marks: BookingCalendarMonthMarks;
  overrides: BookingDayOverrides;
  onSelectDay: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleAvailability: () => void;
  availabilityLocked?: boolean;
};

/** Карточка месяца, сетки дней и подписи выбранной даты (Figma 1:22281). */
export function BookingCalendarMonthCard({
  view,
  marks,
  overrides,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onToggleAvailability,
  availabilityLocked = false,
}: BookingCalendarMonthCardProps): ReactElement {
  const weeks = buildCalendarWeeks(view.month, marks, overrides);
  const control = dayAvailabilityControl(
    resolveCalendarDayMark(view.month, view.selectedDay, marks, overrides),
  );
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
        statusLabel={control.label}
        checked={control.checked}
        disabled={control.disabled || availabilityLocked}
        onToggle={onToggleAvailability}
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

function SelectedDayCaption({
  label,
  statusLabel,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  statusLabel: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}): ReactElement {
  return (
    <div className="flex w-full flex-col gap-1">
      <p className="m-0 text-[14px] font-bold leading-[1.4] text-[#1a1b1d]">
        {label}
      </p>
      <div className="flex w-full items-center justify-between">
        <p className="m-0 text-center text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          {statusLabel}
        </p>
        <BookingCalendarAvailabilityToggle
          checked={checked}
          disabled={disabled}
          label={statusLabel}
          onToggle={onToggle}
        />
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
