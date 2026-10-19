import { createExternalStore } from "../createExternalStore";
import type { CancelledBooking } from "./CancelledBooking";
import { CANCELLED_BOOKINGS_MOCK } from "./cancelledBookingsMock";

const store = createExternalStore<readonly CancelledBooking[]>(
  CANCELLED_BOOKINGS_MOCK,
);

/** Source of the «Отменены» tab: the mock rows plus bookings cancelled from «Подтверждены». */
export const cancelledBookingsStore = {
  get: store.get,
  subscribe: store.subscribe,
  reset: store.reset,
  /** Replaces the whole list. */
  replace(records: readonly CancelledBooking[]): void {
    store.set(records);
  },
  /** Puts new records on top (in the given order); ids already present are skipped. */
  prepend(records: readonly CancelledBooking[]): void {
    const current = store.get();
    const knownIds = new Set(current.map((item) => item.id));
    const fresh = records.filter((item) => !knownIds.has(item.id));
    if (fresh.length > 0) {
      store.set([...fresh, ...current]);
    }
  },
};
