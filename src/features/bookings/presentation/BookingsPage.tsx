import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { BookingTabId } from "../bookingTabId";
import { BookingsGuestSearch } from "../BookingsGuestSearch";
import { BookingsTabs } from "../BookingsTabs";
import { parseBookingsEmptyParam } from "../parseBookingsEmptyParam";
import { parseBookingsTabParam } from "../parseBookingsTabParam";
import { BookingsTabBody } from "./BookingsTabBody";

export function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseBookingsTabParam(params.get("tab"));
  const forceEmpty = parseBookingsEmptyParam(params.get("empty"));
  const [query, setQuery] = useState("");

  function setTab(next: BookingTabId): void {
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
    <div className="flex h-full w-full flex-col gap-8 bg-amber-400/5 p-8 font-sans">
      <h1 className="m-0 shrink-0 text-[24px] font-bold leading-[1.2] text-black">
        Бронирования
      </h1>

      <div className="flex w-full shrink-0 items-start justify-between">
        <BookingsTabs value={tab} onChange={setTab} />
        <BookingsGuestSearch value={query} onChange={setQuery} />
      </div>

      <BookingsTabBody tab={tab} query={query} forceEmpty={forceEmpty} />
    </div>
  );
}
