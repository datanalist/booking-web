import type { RejectedBooking } from "../../domain/RejectedBooking";
import { RejectedBookingRow } from "./RejectedBookingRow";

type RejectedBookingsTableProps = {
  items: readonly RejectedBooking[];
};

export function RejectedBookingsTable({ items }: RejectedBookingsTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white">
      <table className="w-full min-w-[960px] border-collapse font-sans">
        <thead>
          <tr className="bg-[rgba(248,138,42,0.12)] text-left text-[14px] font-bold text-[var(--color-ink)]">
            <th className="px-4 py-3 font-bold">ФИО</th>
            <th className="px-4 py-3 font-bold">Чат</th>
            <th className="px-4 py-3 font-bold">Жилье</th>
            <th className="px-4 py-3 font-bold">Даты</th>
            <th className="px-4 py-3 font-bold">Стоимость</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <RejectedBookingRow key={item.id} booking={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
