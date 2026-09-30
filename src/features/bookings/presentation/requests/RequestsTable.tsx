import type { BookingRequest } from "../../domain/BookingRequest";
import { RequestRow } from "./RequestRow";

type RequestsTableProps = {
  items: readonly BookingRequest[];
  onAccept: (id: BookingRequest["id"]) => void;
  onReject: (id: BookingRequest["id"]) => void;
};

export function RequestsTable({
  items,
  onAccept,
  onReject,
}: RequestsTableProps) {
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
            <th className="px-4 py-3 font-bold" aria-label="Действия" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <RequestRow
              key={item.id}
              request={item}
              onAccept={onAccept}
              onReject={onReject}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
