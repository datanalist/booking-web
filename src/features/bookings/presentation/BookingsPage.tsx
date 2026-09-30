import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookingsGuestSearch } from "../BookingsGuestSearch";
import { BookingsTabs } from "../BookingsTabs";
import {
  DEFAULT_BOOKING_TAB,
  type BookingTabId,
} from "../domain/BookingTabId";
import { BookingsEmptyPanel } from "./BookingsEmptyPanel";
import { ConfirmedBookingsPanel } from "./confirmed/ConfirmedBookingsPanel";
import { RequestsPanel } from "./requests/RequestsPanel";

const EMPTY_COPY: Record<
  Exclude<BookingTabId, "requests">,
  { title: string; description: string }
> = {
  confirmed: {
    title: "Нет бронирований",
    description: "Подтверждённые заявки на бронирования появятся здесь!",
  },
  rejected: {
    title: "Нет бронирований",
    description: "Отклонённые заявки на бронирования появятся здесь!",
  },
  cancelled: {
    title: "Нет бронирований",
    description:
      "Отменённые вами или пользователями бронирования появятся здесь!",
  },
};

export function BookingsPage() {
  const [params] = useSearchParams();
  const forceEmpty = params.get("empty") === "1";
  const [tab, setTab] = useState<BookingTabId>(DEFAULT_BOOKING_TAB);
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <h1 className="m-0 shrink-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
        Бронирования
      </h1>

      <div className="flex w-full shrink-0 items-start justify-between">
        <BookingsTabs value={tab} onChange={setTab} />
        <BookingsGuestSearch value={query} onChange={setQuery} />
      </div>

      {tab === "requests" ? (
        <RequestsPanel query={query} forceEmpty={forceEmpty} />
      ) : tab === "confirmed" ? (
        <ConfirmedBookingsPanel query={query} forceEmpty={forceEmpty} />
      ) : (
        <BookingsEmptyPanel
          title={EMPTY_COPY[tab].title}
          description={EMPTY_COPY[tab].description}
        />
      )}
    </div>
  );
}
