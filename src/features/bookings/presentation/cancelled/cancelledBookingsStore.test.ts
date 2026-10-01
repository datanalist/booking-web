import { afterEach, expect, test, vi } from "vitest";
import type { CancelledBooking } from "./CancelledBooking";
import { CANCELLED_BOOKINGS_MOCK } from "./cancelledBookingsMock";
import { cancelledBookingsStore } from "./cancelledBookingsStore";

afterEach(() => cancelledBookingsStore.reset());

function record(id: string): CancelledBooking {
  const [template] = CANCELLED_BOOKINGS_MOCK;
  if (template === undefined) {
    throw new Error("cancelled mock is empty");
  }
  return { ...template, id };
}

test("starts with the existing mock rows", () => {
  expect(cancelledBookingsStore.get()).toEqual(CANCELLED_BOOKINGS_MOCK);
});

test("prepends new records above the mock rows, keeping the given order", () => {
  cancelledBookingsStore.prepend([record("confirmed-3"), record("confirmed-1")]);
  const ids = cancelledBookingsStore.get().map((item) => item.id);
  expect(ids.slice(0, 2)).toEqual(["confirmed-3", "confirmed-1"]);
  expect(ids.slice(2)).toEqual(CANCELLED_BOOKINGS_MOCK.map((item) => item.id));
});

test("skips ids that are already present", () => {
  cancelledBookingsStore.prepend([record("confirmed-3")]);
  cancelledBookingsStore.prepend([record("confirmed-3")]);
  const count = cancelledBookingsStore
    .get()
    .filter((item) => item.id === "confirmed-3").length;
  expect(count).toBe(1);
});

test("notifies subscribers and reset restores the mock", () => {
  const listener = vi.fn();
  const unsubscribe = cancelledBookingsStore.subscribe(listener);
  cancelledBookingsStore.prepend([record("confirmed-3")]);
  expect(listener).toHaveBeenCalledTimes(1);
  cancelledBookingsStore.reset();
  expect(cancelledBookingsStore.get()).toEqual(CANCELLED_BOOKINGS_MOCK);
  unsubscribe();
  cancelledBookingsStore.prepend([record("confirmed-3")]);
  expect(listener).toHaveBeenCalledTimes(2);
});
