import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs } from "../../../ui/Tabs";
import { BOOKING_TABS } from "../bookingTabId";
import { BookingsGuestSearch } from "../BookingsGuestSearch";
import { parseBookingsEmptyParam } from "../parseBookingsEmptyParam";
import { parseBookingsTabParam } from "../parseBookingsTabParam";
import { BookingsTabBody } from "./BookingsTabBody";

export function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseBookingsTabParam(params.get("tab"));
  const forceEmpty = parseBookingsEmptyParam(params.get("empty"));
  const [query, setQuery] = useState("");

  const tabItems = BOOKING_TABS.map((item) => ({
    id: item.id,
    label: item.label,
  }));

  function setTab(next: string): void {
    const nextParams = new URLSearchParams(params);
    if (next === "requests") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", next);
    }
    setParams(nextParams, { replace: true });
    setQuery("");
  }

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <h1 className="m-0 shrink-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
        Бронирования
      </h1>

      <div className="flex shrink-0 items-end justify-between gap-6">
        <div className="min-w-0 flex-1 overflow-x-auto rounded-t-lg bg-orange-200/60">
          <Tabs items={tabItems} value={tab} onChange={setTab} />
        </div>
        <BookingsGuestSearch value={query} onChange={setQuery} />
      </div>

      <BookingsTabBody tab={tab} query={query} forceEmpty={forceEmpty} />
    </div>
  );
}
