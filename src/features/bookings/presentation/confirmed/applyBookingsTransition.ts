import { cancelledBookingsStore } from "../cancelled/cancelledBookingsStore";
import { confirmedBookingsStore } from "./confirmedBookingsStore";
import type { ConfirmedBookingsTransition } from "./ConfirmedBookingsTransition";
import { toCancelledBooking } from "./toCancelledBooking";

/** Commits a transition: updates «Подтверждены» and writes the cancelled bookings to «Отменены». */
export function applyBookingsTransition(
  transition: ConfirmedBookingsTransition,
): void {
  cancelledBookingsStore.prepend(transition.cancelled.map(toCancelledBooking));
  confirmedBookingsStore.set(transition.confirmed);
}
