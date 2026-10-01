import type { ConfirmedBooking } from "./ConfirmedBooking";
import { ConfirmedBookingRow } from "./ConfirmedBookingRow";

type ConfirmedBookingsTableProps = {
  items: readonly ConfirmedBooking[];
  onOpenRequest: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
};

const HEADER_CELLS = [
  "ФИО",
  "Чат",
  "Жилье",
  "Даты",
  "Стоимость",
  "Статус",
  "",
] as const;

export function ConfirmedBookingsTable({
  items,
  onOpenRequest,
  onCancelBooking,
}: ConfirmedBookingsTableProps) {
  return (
    <div
      role="table"
      aria-label="Подтверждённые бронирования"
      className="w-full overflow-hidden rounded-2xl outline outline-amber-400/20"
    >
      <div
        role="row"
        className="grid h-12 grid-cols-[14rem_4rem_18rem_9rem_7rem_minmax(0,1fr)_3.5rem] items-center bg-amber-400/20"
      >
        {HEADER_CELLS.map((label, index) => (
          <div
            key={label === "" ? "actions" : label}
            role="columnheader"
            className={`flex h-12 items-center px-5 text-sm font-bold leading-5 text-[var(--color-ink)] ${
              index === HEADER_CELLS.length - 1 ? "justify-center px-4" : ""
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      {items.map((item) => (
        <ConfirmedBookingRow
          key={item.id}
          booking={item}
          onOpenRequest={onOpenRequest}
          onCancelBooking={onCancelBooking}
        />
      ))}
    </div>
  );
}
