import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BOOKING_EMPTY_COPY } from "../domain/bookingEmptyCopy";
import {
  BOOKING_TABS,
  DEFAULT_BOOKING_TAB,
} from "../domain/BookingTabId";
import { isBookingTabId, parseBookingTab } from "../domain/parseBookingTab";
import { BookingsEmptyPanel } from "./BookingsEmptyPanel";
import { BookingsGuestSearch } from "./BookingsGuestSearch";
import { BookingsTabs } from "./BookingsTabs";
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
    <div className="flex h-full w-full flex-col gap-8 bg-amber-400/5 p-8 font-sans">
      <h1 className="m-0 shrink-0 text-2xl font-bold leading-7 text-[var(--color-ink)]">
        Бронирования
      </h1>

      <div className="flex w-full shrink-0 items-start justify-between gap-4">
        <BookingsTabs
          items={BOOKING_TABS.map((item) => ({
            id: item.id,
            label: item.label,
          }))}
          value={tab}
          onChange={handleTabChange}
        />
        <BookingsGuestSearch value={query} onChange={setQuery} />
      </div>

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
