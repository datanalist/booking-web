import type { ListingTableRow } from "../../features/listings/ListingTableRow";
import type { ListingTableStatus } from "../../features/listings/listingTableStatus";
import type { HousingType, Listing, ListingDraft, ListingStatus } from "../types";
import {
  amenityIdsFromPb,
  amenityIdsToPb,
  extraAmenityIdsFromPb,
  extraAmenityIdsToPb,
} from "./amenityMap";
import { housingTypeFromPb, housingTypeToPb } from "./housingTypeMap";
import { photosFromPb, photosToPb } from "./listingPhotos";
import {
  listingStatusFromPb,
  listingWritableStatusToPb,
  type PbWritableListingStatus,
} from "./listingStatusMap";
import type { PbHousingType, PbListingRecord } from "./pbTypes";
import { uniquePricesFromPb, uniquePricesToPb, type PbUniquePricePayload } from "./uniquePrices";

export { amenityIdsFromPb, amenityIdsToPb, extraAmenityIdsFromPb, extraAmenityIdsToPb } from "./amenityMap";
export { housingTypeFromPb, housingTypeToPb } from "./housingTypeMap";
export {
  listingStatusFromPb,
  listingStatusToPb,
  listingWritableStatusToPb,
} from "./listingStatusMap";
export type { PbWritableListingStatus } from "./listingStatusMap";

export type PbListingPayload = {
  host: string;
  title: string;
  city: string;
  address: string;
  housing_type: PbHousingType;
  placement_type: HousingType;
  description: string;
  amenities: PbListingRecord["amenities"];
  extras: PbListingRecord["extras"];
  max_guests: number;
  pets_allowed: boolean;
  cancellation_allowed: boolean;
  guests_forbidden: boolean;
  access_info: string;
  house_rules: string;
  extra_info: string;
  check_in_time: string;
  check_out_time: string;
  price_night: number;
  price_14: number;
  price_28: number;
  unique_prices: PbUniquePricePayload[];
  status: PbWritableListingStatus;
  photos?: string[];
};

export type PbListingTablePatch = {
  title: string;
  city?: string;
  address: string;
  housing_type: PbHousingType;
  placement_type: HousingType;
  status: PbWritableListingStatus;
};

export function extractCityFromAddress(address: string, explicitCity?: string): string {
  const explicit = explicitCity?.trim() ?? "";
  if (explicit.length > 0) {
    return explicit;
  }
  return (address.split(",")[0] ?? "").trim();
}

export function pbListingToSiteListing(record: PbListingRecord, baseUrl?: string): Listing {
  const city = record.city.trim();
  const rejectReason = record.reject_reason.trim();
  return {
    id: record.id,
    ownerId: record.host,
    status: listingStatusFromPb(record.status),
    title: record.title,
    address: record.address,
    ...(city.length > 0 ? { city } : {}),
    ...(rejectReason.length > 0 ? { rejectReason } : {}),
    housingType: housingTypeFromPb(record.housing_type, record.placement_type),
    description: record.description,
    photos: photosFromPb(record.photos, record.id, baseUrl),
    amenityIds: amenityIdsFromPb(record.amenities),
    extraAmenityIds: extraAmenityIdsFromPb(record.extras),
    maxGuests: finiteNumber(record.max_guests),
    guestsForbidden: record.guests_forbidden,
    petsAllowed: record.pets_allowed,
    cancellationAllowed: record.cancellation_allowed,
    checkInTime: record.check_in_time,
    checkOutTime: record.check_out_time,
    accessInfo: record.access_info,
    houseRules: record.house_rules,
    extraInfo: record.extra_info,
    priceNight: finiteNumber(record.price_night),
    priceFrom14: finiteNumber(record.price_14),
    priceFrom28: finiteNumber(record.price_28),
    uniquePrices: uniquePricesFromPb(record.unique_prices),
    updatedAt: record.updated,
  };
}

export function siteListingToPbPayload(
  draft: ListingDraft,
  statusOverride?: PbWritableListingStatus,
): PbListingPayload {
  const housing = housingTypeToPb(draft.housingType);
  const photos = photosToPb(draft.photos);
  return {
    host: draft.ownerId,
    title: draft.title,
    city: extractCityFromAddress(draft.address, draft.city),
    address: draft.address,
    housing_type: housing.housing_type,
    placement_type: housing.placement_type,
    description: draft.description,
    amenities: amenityIdsToPb(draft.amenityIds),
    extras: extraAmenityIdsToPb(draft.extraAmenityIds),
    max_guests: draft.maxGuests,
    pets_allowed: draft.petsAllowed,
    cancellation_allowed: draft.cancellationAllowed,
    guests_forbidden: draft.guestsForbidden,
    access_info: draft.accessInfo,
    house_rules: draft.houseRules,
    extra_info: draft.extraInfo,
    check_in_time: draft.checkInTime,
    check_out_time: draft.checkOutTime,
    price_night: draft.priceNight,
    price_14: draft.priceFrom14,
    price_28: draft.priceFrom28,
    unique_prices: uniquePricesToPb(draft.uniquePrices),
    status: statusOverride ?? listingWritableStatusToPb(draft.status),
    ...(photos === undefined ? {} : { photos }),
  };
}

export function listingToTableRow(listing: Listing): ListingTableRow {
  const cover = listing.photos.find((photo) => photo.trim().length > 0);
  return {
    id: listing.id,
    title: listing.title,
    address: listing.address,
    housingType: listing.housingType,
    status: listingStatusToTable(listing.status),
    ...(cover === undefined ? {} : { coverUrl: cover }),
  };
}

export function pbListingToTableRow(record: PbListingRecord, baseUrl?: string): ListingTableRow {
  return listingToTableRow(pbListingToSiteListing(record, baseUrl));
}

export function tableRowToPbPatch(
  row: ListingTableRow,
  options?: { city?: string },
): PbListingTablePatch {
  const housing = housingTypeToPb(row.housingType);
  const city = cityForTablePatch(row.address, options?.city);
  return {
    title: row.title,
    address: row.address,
    ...(city === undefined ? {} : { city }),
    housing_type: housing.housing_type,
    placement_type: housing.placement_type,
    status: tableStatusToPb(row.status),
  };
}

function finiteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function listingStatusToTable(status: ListingStatus): ListingTableStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "moderation":
      return "moderation";
    case "published":
      return "published";
    case "archived":
      return "unpublished";
  }
}

function tableStatusToPb(status: ListingTableStatus): PbWritableListingStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "moderation":
    case "published":
      return "pending";
    case "unpublished":
      return "archived";
  }
}

function cityForTablePatch(address: string, explicitCity: string | undefined): string | undefined {
  if (explicitCity !== undefined) {
    const trimmed = explicitCity.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  const comma = address.indexOf(",");
  if (comma < 0) {
    return undefined;
  }
  const head = address.slice(0, comma).trim();
  if (head.length === 0 || isStreetHead(head)) {
    return undefined;
  }
  return head;
}

function isStreetHead(value: string): boolean {
  const head = value.toLocaleLowerCase("ru");
  return head.startsWith("ул.") || head.startsWith("пер.") || head.startsWith("пр.") || head.startsWith("д.");
}
