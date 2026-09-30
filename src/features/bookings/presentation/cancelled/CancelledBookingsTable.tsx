import type { CancelledBooking } from "./CancelledBooking";
import { CancelledBookingRow } from "./CancelledBookingRow";

type CancelledBookingsTableProps = {
  items: readonly CancelledBooking[];
};

const COLUMNS = [
  "ФИО",
  "Чат",
  "Жилье",
  "Даты",
  "Стоимость",
] as const;

export function CancelledBookingsTable({ items }: CancelledBookingsTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white">
      <table className="w-full border-collapse font-sans text-left">
        <thead>
          <tr className="bg-[rgba(251,192,40,0.35)]">
            {COLUMNS.map((label) => (
              <th
                key={label}
                scope="col"
                className="px-4 py-3 text-[14px] font-bold text-[var(--color-ink)]"
              >
                {label}
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
