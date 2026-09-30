import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs } from "../../ui/Tabs";
import { BOOKING_EMPTY_COPY } from "./bookingEmptyCopy";
import { BOOKING_TABS, isBookingTabId, type BookingTabId } from "./bookingTabId";
import { BookingsEmptyCard } from "./BookingsEmptyCard";
import { BookingsGuestSearch } from "./BookingsGuestSearch";
import { ConfirmedBookingsPanel } from "./presentation/confirmed/ConfirmedBookingsPanel";

function readTab(params: URLSearchParams): BookingTabId {
  const value = params.get("tab");
  return isBookingTabId(value) ? value : "requests";
}

export function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = readTab(params);
  const [query, setQuery] = useState("");
  const forceEmpty = params.get("empty") === "1";

  function setTab(next: BookingTabId): void {
    const nextParams = new URLSearchParams(params);
    if (next === "requests") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", next);
    }
    setParams(nextParams, { replace: true });
  }

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-amber-400/5 p-8 font-sans">
      <div className="flex w-full shrink-0 items-center justify-between">
        <h1 className="m-0 text-2xl font-bold leading-7 text-[var(--color-ink)]">
          Бронирования
        </h1>
      </div>

      <div className="flex w-full shrink-0 items-start justify-between gap-4">
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
        <BookingsGuestSearch value={query} onChange={setQuery} />
      </div>

      {tab === "confirmed" ? (
        <ConfirmedBookingsPanel query={query} forceEmpty={forceEmpty} />
      ) : (
        <BookingsEmptyCard copy={BOOKING_EMPTY_COPY[tab]} />
      )}
    </div>
  );
}
