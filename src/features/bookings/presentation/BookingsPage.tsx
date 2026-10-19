import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SESSION_KEY } from "../../../api/keys";
import {
  createCabinetPbClient,
  resolveCabinetDataSource,
} from "../../../api/pocketbase";
import type { BookingTabId } from "../bookingTabId";
import { BookingsGuestSearch } from "../BookingsGuestSearch";
import { BookingsTabs } from "../BookingsTabs";
import type { BookingRequest, BookingRequestId } from "../domain/BookingRequest";
import { parseBookingsEmptyParam } from "../parseBookingsEmptyParam";
import { parseBookingsTabParam } from "../parseBookingsTabParam";
import {
  createPbBookingsSource,
  type BookingsSnapshot,
  type BookingsSource,
} from "../pocketbase";
import { BookingsTabBody } from "./BookingsTabBody";
import { cancelledBookingsStore } from "./cancelled/cancelledBookingsStore";
import type { ConfirmedBooking } from "./confirmed/ConfirmedBooking";
import type { ConfirmedBookingId } from "./confirmed/ConfirmedBookingId";
import { confirmedBookingsStore } from "./confirmed/confirmedBookingsStore";
import type { RequestDecision } from "./confirmed/request/RequestDecision";

function readHostId(): string | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || !("userId" in parsed)) {
      return null;
    }
    const userId = parsed.userId;
    return typeof userId === "string" && userId !== "" ? userId : null;
  } catch {
    return null;
  }
}

export function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseBookingsTabParam(params.get("tab"));
  const forceEmpty = parseBookingsEmptyParam(params.get("empty"));
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<readonly BookingRequest[] | undefined>(
    undefined,
  );
  const [pocketbaseLive, setPocketbaseLive] = useState(false);
  const sourceRef = useRef<BookingsSource | null>(null);
  const mountedRef = useRef(true);

  function publish(snapshot: BookingsSnapshot): void {
    setRequests(snapshot.requests);
    confirmedBookingsStore.set(snapshot.confirmed);
    cancelledBookingsStore.replace(snapshot.cancelled);
    setPocketbaseLive(true);
  }

  async function reload(source: BookingsSource): Promise<void> {
    const hostId = readHostId();
    if (hostId === null || !mountedRef.current) return;
    const snapshot = await source.load(hostId);
    if (!mountedRef.current) return;
    publish(snapshot);
  }

  useEffect(() => {
    mountedRef.current = true;
    if (resolveCabinetDataSource() !== "pocketbase") {
      return () => {
        mountedRef.current = false;
      };
    }
    const hostId = readHostId();
    if (hostId === null) {
      return () => {
        mountedRef.current = false;
      };
    }
    const source = createPbBookingsSource(createCabinetPbClient());
    sourceRef.current = source;
    void source
      .load(hostId)
      .then((snapshot) => {
        if (mountedRef.current) publish(snapshot);
      })
      .catch(() => undefined);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function afterAction(action: (source: BookingsSource) => Promise<void>): void {
    const source = sourceRef.current;
    if (source === null) return;
    void action(source)
      .then(() => reload(source))
      .catch(() => undefined);
  }

  function handleAccept(id: BookingRequestId): void {
    afterAction((source) => source.accept(id));
  }

  function handleReject(id: BookingRequestId, comment: string): void {
    afterAction((source) => source.reject(id, comment));
  }

  function handleHostCancel(id: ConfirmedBookingId, comment: string): void {
    afterAction((source) => source.hostCancel(id, comment));
  }

  function handleResolveRequest(
    booking: ConfirmedBooking,
    decision: RequestDecision,
  ): void {
    afterAction((source) => source.resolveRequest(booking, decision));
  }

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

      <BookingsTabBody
        tab={tab}
        query={query}
        forceEmpty={forceEmpty}
        {...(pocketbaseLive
          ? {
              requests,
              onAccept: handleAccept,
              onReject: handleReject,
              onHostCancel: handleHostCancel,
              onResolveRequest: handleResolveRequest,
            }
          : {})}
      />
    </div>
  );
}
