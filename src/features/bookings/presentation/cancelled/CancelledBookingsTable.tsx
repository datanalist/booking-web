import type { CancelledBooking } from "./CancelledBooking";
import { CancelledBookingRow } from "./CancelledBookingRow";

type CancelledBookingsTableProps = {
  items: readonly CancelledBooking[];
};

type ColumnDef = {
  label: string;
  className: string;
};

const COLUMNS: readonly ColumnDef[] = [
  { label: "ФИО", className: "w-56 px-5" },
  { label: "Чат", className: "w-16 px-5" },
  { label: "Жилье", className: "w-72 px-5" },
  { label: "Даты", className: "w-36 px-5" },
  { label: "Стоимость", className: "w-28 px-5" },
];

export function CancelledBookingsTable({ items }: CancelledBookingsTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-amber-400/20 bg-white">
      <table className="w-full table-fixed border-collapse font-sans text-left">
        <thead>
          <tr className="h-12 bg-amber-400/20">
            {COLUMNS.map((column) => (
              <th
                key={column.label}
                scope="col"
                className={`${column.className} text-sm font-bold leading-5 text-black opacity-90`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((booking) => (
            <CancelledBookingRow key={booking.id} booking={booking} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
