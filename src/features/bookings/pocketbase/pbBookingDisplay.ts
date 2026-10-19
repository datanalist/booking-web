import { formatPhoneMask } from "../../../lib/formatPhoneMask";
import { formatRub, rub, type Rub } from "../../../lib/money";
import { bookingStay, type BookingStay } from "../presentation/confirmed/stay/BookingStay";
import { formatStayTable } from "../presentation/confirmed/stay/formatStayTable";
import type { PbBookingGuest, PbBookingListing, PbBookingRecord } from "./pbBookingTypes";
import { isoDayKey } from "./pbBookingTime";

const USERS_COLLECTION = "users";
const LISTINGS_COLLECTION = "listings";

export function formatGuestName(guest: PbBookingGuest | undefined): string {
  const preferred = guest?.name?.trim() ?? "";
  if (preferred !== "") return preferred;
  const first = guest?.first_name?.trim() ?? "";
  const last = guest?.last_name?.trim() ?? "";
  return [first, last].filter((part) => part !== "").join(" ");
}

export function formatGuestPhone(phone: string | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  return formatPhoneMask(digits);
}

export function pbFileUrl(
  baseUrl: string | undefined,
  collection: string,
  recordId: string,
  fileName: string | undefined,
): string {
  const name = fileName?.trim() ?? "";
  const id = recordId.trim();
  if (name === "" || id === "") return "";
  if (/^https?:\/\//i.test(name) || name.startsWith("/")) return name;
  const path = `/api/files/${encodeURIComponent(collection)}/${encodeURIComponent(id)}/${encodeURIComponent(name)}`;
  const base = (baseUrl ?? "").trim().replace(/\/+$/, "");
  return `${base}${path}`;
}

export function formatListingAddress(listing: PbBookingListing | undefined): string {
  const city = listing?.city?.trim() ?? "";
  const address = listing?.address?.trim() ?? "";
  if (city !== "" && address !== "" && !address.toLowerCase().startsWith(city.toLowerCase())) {
    return `${city}, ${address}`;
  }
  return address !== "" ? address : city;
}

export function stayFromRecord(checkIn: string, checkOut: string): BookingStay | null {
  const start = isoDayKey(checkIn);
  const end = isoDayKey(checkOut);
  if (start === "" || end === "" || start >= end) return null;
  try {
    return bookingStay(start, end);
  } catch {
    return null;
  }
}

export type PbBookingCard = {
  guestName: string;
  guestPhone: string;
  guestAvatarUrl: string;
  listingTitle: string;
  listingAddress: string;
  listingPhotoUrl: string;
  datesLabel: string;
  priceLabel: string;
  price: Rub;
  stay: BookingStay;
};

function firstPhoto(photos: readonly string[] | undefined): string | undefined {
  return photos?.find((photo) => photo.trim() !== "");
}

export function pbBookingCard(
  record: PbBookingRecord,
  baseUrl?: string,
): PbBookingCard | null {
  if (record.id.trim() === "") return null;
  const stay = stayFromRecord(record.check_in, record.check_out);
  if (stay === null) return null;
  const guest = record.expand?.guest;
  const listing = record.expand?.listing;
  const guestId = guest?.id.trim() || record.guest;
  const listingId = listing?.id.trim() || record.listing;
  return {
    guestName: formatGuestName(guest),
    guestPhone: formatGuestPhone(guest?.phone),
    guestAvatarUrl: pbFileUrl(baseUrl, USERS_COLLECTION, guestId, guest?.avatar),
    listingTitle: listing?.title?.trim() ?? "",
    listingAddress: formatListingAddress(listing),
    listingPhotoUrl: pbFileUrl(baseUrl, LISTINGS_COLLECTION, listingId, firstPhoto(listing?.photos)),
    datesLabel: formatStayTable(stay),
    priceLabel: formatRub(record.total),
    price: rub(record.total),
    stay,
  };
}
