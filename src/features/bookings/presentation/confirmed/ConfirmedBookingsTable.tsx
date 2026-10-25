import type { ConfirmedBooking } from "./ConfirmedBooking";
import { CONFIRMED_BOOKINGS_GRID_CLASS } from "./confirmedBookingsGrid";
import { ConfirmedBookingRow } from "./ConfirmedBookingRow";
import type { ConfirmedBookingRowActions } from "./menu/ConfirmedBookingRowActions";

type ConfirmedBookingsTableProps = {
  items: readonly ConfirmedBooking[];
  actions: ConfirmedBookingRowActions;
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
  actions,
}: ConfirmedBookingsTableProps) {
  return (
    <div
      role="table"
      aria-label="Подтверждённые бронирования"
      className="w-full overflow-hidden rounded-2xl outline outline-amber-400/20"
    >
      <div
        role="row"
        className={`grid h-12 ${CONFIRMED_BOOKINGS_GRID_CLASS} items-center bg-amber-400/20`}
      >
        {HEADER_CELLS.map((label, index) => (
          <div
            key={label === "" ? "actions" : label}
            role="columnheader"
            className={`flex h-12 items-center text-sm font-bold leading-5 text-[var(--color-ink)] ${
              index === HEADER_CELLS.length - 1 ? "justify-center" : "min-w-0 px-5"
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
          actions={actions}
        />
      ))}
    </div>
  );
}
