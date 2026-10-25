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
import type { RejectedBooking } from "../domain/RejectedBooking";
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
import type { BookingReview } from "./confirmed/review/BookingReview";
import { bookingReviewsStore } from "./confirmed/review/bookingReviewsStore";

function emptyBookingsSnapshot(): BookingsSnapshot {
  return { requests: [], confirmed: [], rejected: [], cancelled: [] };
}

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
  const pocketbase = resolveCabinetDataSource() === "pocketbase";
  const [loaded, setLoaded] = useState(!pocketbase);
  const [requests, setRequests] = useState<readonly BookingRequest[] | undefined>(
    undefined,
  );
  const [rejected, setRejected] = useState<readonly RejectedBooking[] | undefined>(
    undefined,
  );
  const sourceRef = useRef<BookingsSource | null>(null);
  const mountedRef = useRef(true);

  function publish(snapshot: BookingsSnapshot): void {
    setRequests(snapshot.requests);
    setRejected(snapshot.rejected);
    confirmedBookingsStore.set(snapshot.confirmed);
    cancelledBookingsStore.replace(snapshot.cancelled);
    bookingReviewsStore.replace(snapshot.guestReviews ?? []);
    setLoaded(true);
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
    if (!pocketbase) {
      return () => {
        mountedRef.current = false;
      };
    }
    const hostId = readHostId();
    if (hostId === null) {
      publish(emptyBookingsSnapshot());
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
      .catch(() => {
        if (mountedRef.current) publish(emptyBookingsSnapshot());
      });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function afterAction(
    action: (source: BookingsSource) => Promise<void>,
  ): Promise<void> {
    const source = sourceRef.current;
    if (source === null) {
      throw new Error("Bookings source is unavailable");
    }
    await action(source);
    await reload(source);
  }

  function handleAccept(id: BookingRequestId): Promise<void> {
    return afterAction((source) => source.accept(id));
  }

  function handleReject(id: BookingRequestId, comment: string): Promise<void> {
    return afterAction((source) => source.reject(id, comment));
  }

  function handleHostCancel(id: ConfirmedBookingId, comment: string): Promise<void> {
    return afterAction((source) => source.hostCancel(id, comment));
  }

  function handleResolveRequest(
    booking: ConfirmedBooking,
    decision: RequestDecision,
  ): Promise<void> {
    return afterAction((source) => source.resolveRequest(booking, decision));
  }

  function handleSubmitReview(review: BookingReview): Promise<void> {
    const source = sourceRef.current;
    const hostId = readHostId();
    if (source === null || hostId === null) {
      return Promise.reject(new Error("Bookings source is unavailable"));
    }
    const booking = confirmedBookingsStore.get().find((item) => item.id === review.bookingId);
    return source.createGuestReview(review, {
      authorId: hostId,
      ...(booking?.guestId !== undefined && booking.guestId !== ""
        ? { guestId: booking.guestId }
        : {}),
      ...(booking?.listingId !== undefined && booking.listingId !== ""
        ? { listingId: booking.listingId }
        : {}),
    });
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
        pending={pocketbase && !loaded}
        {...(pocketbase && loaded
          ? {
              requests: requests ?? [],
              rejected: rejected ?? [],
              onAccept: handleAccept,
              onReject: handleReject,
              onHostCancel: handleHostCancel,
              onResolveRequest: handleResolveRequest,
              onSubmitReview: handleSubmitReview,
            }
          : {})}
      />
    </div>
  );
}
