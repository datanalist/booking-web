import type { PbClient } from "../../api/pocketbase/pbClient";
import { createCabinetPbClient } from "../../api/pocketbase/pbSession";
import type { PbListingBlockRecord, PbListingRecord } from "../../api/pocketbase/pbTypes";
import type { PbBookingListing, PbBookingRecord } from "../bookings/pocketbase/pbBookingTypes";
import {
  EMPTY_LISTING_BOOKING_CALENDAR,
  type ListingBookingCalendarData,
} from "./bookingCalendarFromBookings";

const LISTING_ID = /^[a-z0-9]{15}$/;
const PAGE_SIZE = 200;

/** Брони, карточка объявления и ручные блокировки для календаря хозяина. */
export async function loadListingBookingCalendar(
  listingId: string,
  client: PbClient = createCabinetPbClient(),
): Promise<ListingBookingCalendarData> {
  if (!LISTING_ID.test(listingId)) {
    return { ...EMPTY_LISTING_BOOKING_CALENDAR, baseUrl: client.baseUrl };
  }

  const [bookings, listing, blocks] = await Promise.allSettled([
    listAll<PbBookingRecord>(client, "bookings", {
      filter: `listing="${listingId}"`,
      expand: "guest,listing",
      sort: "check_in",
    }),
    client.getRecord<PbListingRecord>("listings", listingId),
    listAll<PbListingBlockRecord>(client, "listing_blocks", {
      filter: `listing="${listingId}"`,
      sort: "start",
    }),
  ]);

  const records = bookings.status === "fulfilled" ? bookings.value : [];
  const listingRecord = listing.status === "fulfilled" ? listing.value : null;
  return {
    baseUrl: client.baseUrl,
    records,
    listing: toListing(listingRecord) ?? listingFromBookings(records),
    blocks: blocks.status === "fulfilled" ? blocks.value : [],
  };
}

function toListing(record: PbListingRecord | null): PbBookingListing | null {
  if (record === null || record.id.trim() === "") {
    return null;
  }
  return {
    id: record.id,
    title: record.title,
    city: record.city,
    address: record.address,
    photos: Array.isArray(record.photos) ? record.photos : [],
  };
}

function listingFromBookings(records: readonly PbBookingRecord[]): PbBookingListing | null {
  for (const record of records) {
    const listing = record.expand?.listing;
    if (listing !== undefined && listing.id.trim() !== "") {
      return listing;
    }
  }
  return null;
}

async function listAll<TItem>(
  client: PbClient,
  collection: string,
  query: { filter: string; sort: string; expand?: string },
): Promise<TItem[]> {
  const items: TItem[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const listed = await client.listRecords<TItem>(collection, {
      ...query,
      page,
      perPage: PAGE_SIZE,
    });
    items.push(...listed.items);
    totalPages = Number.isFinite(listed.totalPages) ? listed.totalPages : page;
    page += 1;
  } while (page <= totalPages);
  return items;
}
