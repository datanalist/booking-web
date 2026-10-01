import { useSyncExternalStore } from "react";
import type { CancelledBooking } from "./CancelledBooking";
import { cancelledBookingsStore } from "./cancelledBookingsStore";

export function useCancelledBookings(): readonly CancelledBooking[] {
  return useSyncExternalStore(
    cancelledBookingsStore.subscribe,
    cancelledBookingsStore.get,
  );
}
