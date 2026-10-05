import { useSyncExternalStore } from "react";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import { confirmedBookingsStore } from "./confirmedBookingsStore";

export function useConfirmedBookings(): readonly ConfirmedBooking[] {
  return useSyncExternalStore(
    confirmedBookingsStore.subscribe,
    confirmedBookingsStore.get,
  );
}
