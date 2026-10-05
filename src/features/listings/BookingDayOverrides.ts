import type { IsoDate } from "../../lib/isoDate";

/** Ручные правки доступности: блокировка дня и снятие демо-недоступности. */
export type BookingDayOverrides = {
  readonly blocked: ReadonlySet<IsoDate>;
  readonly released: ReadonlySet<IsoDate>;
};

export function emptyBookingDayOverrides(): BookingDayOverrides {
  return { blocked: new Set(), released: new Set() };
}
