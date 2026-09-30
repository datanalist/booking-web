import type { RejectedBooking } from "../../domain/RejectedBooking";
import { RejectedBookingRow } from "./RejectedBookingRow";

type RejectedBookingsTableProps = {
  items: readonly RejectedBooking[];
};

const HEADER_CELLS = [
  { label: "ФИО", className: "w-56 px-5" },
  { label: "Чат", className: "w-16 px-2 justify-center" },
  { label: "Жилье", className: "w-72 px-5" },
  { label: "Даты", className: "w-36 px-5" },
  { label: "Стоимость", className: "w-28 px-5" },
] as const;

export function RejectedBookingsTable({ items }: RejectedBookingsTableProps) {
  return (
    <div
      role="table"
      aria-label="Отклонённые бронирования"
      className="w-full min-w-[720px] overflow-hidden rounded-2xl outline outline-amber-400/20"
    >
      <div
        role="row"
        className="flex h-12 items-center bg-amber-400/20 text-sm font-bold opacity-90"
      >
        {HEADER_CELLS.map((cell) => (
          <div
            key={cell.label}
            role="columnheader"
            className={`flex h-12 items-center text-[var(--color-ink)] ${cell.className}`}
          >
            {cell.label}
          </div>
        ))}
      </div>
      {items.map((item) => (
        <RejectedBookingRow key={item.id} booking={item} />
      ))}
    </div>
  );
}
