import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";
import { BookingCalendarMonthGrid } from "./BookingCalendarMonthGrid";

type BookingCalendarMonthCardProps = {
  monthLabel: string;
  selectedDayLabel: string;
  available: boolean;
  onAvailableChange: (available: boolean) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

/** Карточка месяца и переключателя доступности (Figma 1:22281). */
export function BookingCalendarMonthCard({
  monthLabel,
  selectedDayLabel,
  available,
  onAvailableChange,
  onPrevMonth,
  onNextMonth,
}: BookingCalendarMonthCardProps): ReactElement {
  return (
    <div className="flex flex-col gap-10 rounded-2xl border border-solid border-[rgba(251,192,40,0.17)] bg-white p-6">
      <MonthHeader
        monthLabel={monthLabel}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
      <BookingCalendarMonthGrid />
      <SelectedDayAvailability
        selectedDayLabel={selectedDayLabel}
        available={available}
        onAvailableChange={onAvailableChange}
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

function SelectedDayAvailability({
  selectedDayLabel,
  available,
  onAvailableChange,
}: {
  selectedDayLabel: string;
  available: boolean;
  onAvailableChange: (available: boolean) => void;
}): ReactElement {
  return (
    <div className="flex w-full flex-col gap-1">
      <p className="m-0 text-[14px] font-bold leading-[1.4] text-[#1a1b1d]">
        {selectedDayLabel}
      </p>
      <div className="flex w-full items-center justify-between">
        <p className="m-0 text-center text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          доступно для бронирования
        </p>
        <AvailabilityToggle
          checked={available}
          onCheckedChange={onAvailableChange}
        />
      </div>
    </div>
  );
}

function AvailabilityToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="доступно для бронирования"
      onClick={() => onCheckedChange(!checked)}
      className={`relative h-6 w-[44px] shrink-0 cursor-pointer overflow-hidden rounded-[1000px] border-0 p-0 ${
        checked ? "bg-[#f88a2a]" : "bg-[#525353]"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-0 size-6 rounded-[1000px] border-2 border-solid bg-white transition-[left] duration-150 ${
          checked ? "left-5 border-[#f88a2a]" : "left-0 border-[#525353]"
        }`}
      />
    </button>
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
