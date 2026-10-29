import { createCabinetPbClient, readPbToken, type PbClient } from "../../api/pocketbase";
import type { BookingDayOverrides } from "./BookingDayOverrides";
import {
  emptyBookingCalendarLoad,
  loadBookingCalendar,
  replaceListingBlocks,
  type BookingCalendarLoad,
} from "./loadBookingCalendar";

export type BookingCalendarPort = {
  load(listingId: string): Promise<BookingCalendarLoad>;
  saveBlocks(listingId: string, overrides: BookingDayOverrides): Promise<void>;
};

/** Календарь хозяина: клиент с токеном сессии. Без токена сеть не вызывается. */
export function createListingCalendarPort(
  storage: Storage = localStorage,
  client?: PbClient,
): BookingCalendarPort {
  return {
    async load(listingId) {
      const active = resolveClient(storage, client);
      if (active === null) {
        return emptyBookingCalendarLoad();
      }
      return loadBookingCalendar(active, listingId);
    },
    async saveBlocks(listingId, overrides) {
      const active = resolveClient(storage, client);
      if (active === null) {
        return;
      }
      await replaceListingBlocks(active, listingId, overrides);
    },
  };
}

function resolveClient(storage: Storage, client: PbClient | undefined): PbClient | null {
  if (client !== undefined) {
    return client;
  }
  if (readPbToken(storage) === null) {
    return null;
  }
  return createCabinetPbClient(storage);
}
