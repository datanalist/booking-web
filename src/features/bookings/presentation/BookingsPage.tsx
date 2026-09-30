import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "../../../ui/Search";
import { Tabs } from "../../../ui/Tabs";
import {
  BOOKING_TABS,
  DEFAULT_BOOKING_TAB,
  type BookingTabId,
} from "../domain/BookingTabId";
import { BookingsEmptyPanel } from "./BookingsEmptyPanel";
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

function isBookingTabId(value: string): value is BookingTabId {
  return BOOKING_TABS.some((tab) => tab.id === value);
}

export function BookingsPage() {
  const [params] = useSearchParams();
  const forceEmpty = params.get("empty") === "1";
  const [tab, setTab] = useState<BookingTabId>(DEFAULT_BOOKING_TAB);
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <div className="flex w-full shrink-0 items-center justify-between gap-4">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Бронирования
        </h1>
        <div className="w-[320px] shrink-0">
          <Search
            value={query}
            onChange={setQuery}
            placeholder="Введите имя или номер гостя"
          />
        </div>
      </div>

      <Tabs
        items={BOOKING_TABS.map((item) => ({
          id: item.id,
          label: item.label,
        }))}
        value={tab}
        onChange={(id) => {
          if (isBookingTabId(id)) {
            setTab(id);
          }
        }}
      />

      {tab === "requests" ? (
        <RequestsPanel query={query} forceEmpty={forceEmpty} />
      ) : (
        <BookingsEmptyPanel
          title={EMPTY_COPY[tab].title}
          description={EMPTY_COPY[tab].description}
        />
      )}
    </div>
  );
}
