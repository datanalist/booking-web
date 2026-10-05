import { createExternalStore } from "../createExternalStore";
import type { ConfirmedBooking } from "./ConfirmedBooking";
import { CONFIRMED_BOOKINGS_MOCK } from "./confirmedBookingsMock";

/** Source of the «Подтверждены» tab; survives tab switches inside the SPA. */
export const confirmedBookingsStore = createExternalStore<
  readonly ConfirmedBooking[]
>(CONFIRMED_BOOKINGS_MOCK);
