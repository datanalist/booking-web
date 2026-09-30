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
    <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-amber-400/20 bg-white">
      <table className="w-full min-w-[960px] border-collapse font-sans">
        <thead>
          <tr className="h-12 bg-amber-400/20 text-left text-sm font-bold text-[var(--color-ink)]">
            <th className="w-56 px-5 font-bold opacity-90">ФИО</th>
            <th className="w-16 px-2 font-bold opacity-90">Чат</th>
            <th className="w-72 px-5 font-bold opacity-90">Жилье</th>
            <th className="w-36 px-5 font-bold opacity-90">Даты</th>
            <th className="w-28 px-5 font-bold opacity-90">Стоимость</th>
            <th className="px-5 font-bold" aria-label="Действия" />
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
