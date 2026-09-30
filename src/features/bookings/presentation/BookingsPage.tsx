import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "../../../ui/Search";
import { Tabs } from "../../../ui/Tabs";
import { BOOKING_EMPTY_COPY } from "../domain/bookingEmptyCopy";
import {
  BOOKING_TABS,
  DEFAULT_BOOKING_TAB,
} from "../domain/BookingTabId";
import { isBookingTabId, parseBookingTab } from "../domain/parseBookingTab";
import { BookingsEmptyPanel } from "./BookingsEmptyPanel";
import { RejectedBookingsPanel } from "./rejected/RejectedBookingsPanel";

export function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseBookingTab(params.get("tab"));
  const forceEmpty = params.get("empty") === "1";
  const [query, setQuery] = useState("");

  function handleTabChange(id: string): void {
    if (!isBookingTabId(id)) {
      return;
    }
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id === DEFAULT_BOOKING_TAB) {
          next.delete("tab");
        } else {
          next.set("tab", id);
        }
        return next;
      },
      { replace: true },
    );
  }

  const foreignCopy = BOOKING_EMPTY_COPY[tab];

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
        onChange={handleTabChange}
      />

      {tab === "rejected" ? (
        <RejectedBookingsPanel query={query} forceEmpty={forceEmpty} />
      ) : (
        <BookingsEmptyPanel
          title={foreignCopy.title}
          description={foreignCopy.description}
        />
      )}
    </div>
  );
}
