import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookingsGuestSearch } from "../BookingsGuestSearch";
import { BookingsTabs } from "../BookingsTabs";
import {
  DEFAULT_BOOKING_TAB,
  type BookingTabId,
} from "../domain/BookingTabId";
import { parseBookingTab } from "../domain/parseBookingTab";
import { BookingsEmptyPanel } from "./BookingsEmptyPanel";
import { ConfirmedBookingsPanel } from "./confirmed/ConfirmedBookingsPanel";
import { RejectedBookingsPanel } from "./rejected/RejectedBookingsPanel";
import { RequestsPanel } from "./requests/RequestsPanel";

export function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseBookingTab(params.get("tab"));
  const forceEmpty = params.get("empty") === "1";
  const [query, setQuery] = useState("");

  function setTab(next: BookingTabId): void {
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        if (next === DEFAULT_BOOKING_TAB) {
          nextParams.delete("tab");
        } else {
          nextParams.set("tab", next);
        }
        return nextParams;
      },
      { replace: true },
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-amber-400/5 p-8 font-sans">
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
      ) : tab === "rejected" ? (
        <RejectedBookingsPanel query={query} forceEmpty={forceEmpty} />
      ) : (
        <BookingsEmptyPanel
          title="Нет бронирований"
          description="Отменённые вами или пользователями бронирования появятся здесь!"
        />
      )}
    </div>
  );
}
