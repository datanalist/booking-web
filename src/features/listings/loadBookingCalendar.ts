import {
  bookingOverridesToBlockRanges,
  type PbClient,
  type PbListingBlockRecord,
  type PbListingRecord,
} from "../../api/pocketbase";
import type { PbBookingRecord } from "../bookings/pocketbase/pbBookingTypes";
import type { BookingDayOverrides } from "./BookingDayOverrides";

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

export type BookingCalendarListing = {
  id: string;
  title: string;
  city: string;
  address: string;
  photos: readonly string[];
};

export type BookingCalendarLoad = {
  listing: BookingCalendarListing | null;
  bookings: readonly PbBookingRecord[];
  blocks: readonly PbListingBlockRecord[];
  baseUrl: string;
};

export function emptyBookingCalendarLoad(baseUrl = ""): BookingCalendarLoad {
  return { listing: null, bookings: [], blocks: [], baseUrl };
}

export function bindListingId(listingId: string): string | null {
  const id = listingId.trim();
  if (!/^[A-Za-z0-9]+$/.test(id)) {
    return null;
  }
  return id;
}

/** Читает объявление, его брони и ручные блоки токеном переданного клиента. */
export async function loadBookingCalendar(
  client: PbClient,
  listingId: string,
): Promise<BookingCalendarLoad> {
  const id = bindListingId(listingId);
  if (id === null) {
    return emptyBookingCalendarLoad(client.baseUrl);
  }
  const [listing, bookings, blocks] = await Promise.all([
    client.getRecord<PbListingRecord>("listings", id).then(toListing).catch(() => null),
    listAll<PbBookingRecord>(client, "bookings", `listing="${id}"`, {
      expand: "guest",
      sort: "check_in",
    }),
    listAll<PbListingBlockRecord>(client, "listing_blocks", `listing="${id}"`, {
      sort: "start",
    }),
  ]);
  return { listing, bookings, blocks, baseUrl: client.baseUrl };
}

/** Заменяет блоки объявления диапазонами из переключателя доступности. */
export async function replaceListingBlocks(
  client: PbClient,
  listingId: string,
  overrides: BookingDayOverrides,
): Promise<void> {
  const id = bindListingId(listingId);
  if (id === null) {
    return;
  }
  const existing = await listAll<PbListingBlockRecord>(client, "listing_blocks", `listing="${id}"`, {
    sort: "start",
  });
  for (const block of existing) {
    if (block.id.trim() === "") {
      continue;
    }
    await client.deleteRecord("listing_blocks", block.id);
  }
  for (const range of bookingOverridesToBlockRanges(overrides)) {
    await client.createRecord("listing_blocks", {
      listing: id,
      start: range.start,
      end: range.end,
    });
  }
}

function toListing(record: PbListingRecord): BookingCalendarListing {
  const photos = Array.isArray(record.photos)
    ? record.photos.filter((photo): photo is string => typeof photo === "string")
    : [];
  return {
    id: text(record.id),
    title: text(record.title),
    city: text(record.city),
    address: text(record.address),
    photos,
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function listAll<T>(
  client: PbClient,
  collection: string,
  filter: string,
  extra: { expand?: string; sort?: string },
): Promise<T[]> {
  const query = {
    filter,
    perPage: PAGE_SIZE,
    sort: extra.sort,
    expand: extra.expand,
  };
  const first = await client.listRecords<T>(collection, { ...query, page: 1 });
  const items = [...first.items];
  const pages = Math.min(first.totalPages, MAX_PAGES);
  for (let page = 2; page <= pages; page += 1) {
    const next = await client.listRecords<T>(collection, { ...query, page });
    items.push(...next.items);
  }
  return items;
}
