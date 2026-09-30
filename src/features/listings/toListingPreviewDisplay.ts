import type {
  AmenityId,
  ExtraAmenityId,
  HousingType,
  Listing,
} from "../../api/types";
import {
  formatIsoDateDisplay,
  parseIsoDate,
  type IsoDate,
} from "../../lib/isoDate";
import { LISTING_PREVIEW_DEMO } from "./listingPreviewDemo";
import { LISTING_PREVIEW_DEMO_PHOTOS } from "./listingPreviewDemoPhotos";
import type { ListingTableStatus } from "./listingTableStatus";
import { listingTableStatusFromApi } from "./listingTableStatusFromApi";

export type ListingPreviewPriceTier = {
  label: string;
  base: number;
};

export type ListingPreviewDisplay = {
  status: ListingTableStatus;
  title: string;
  address: string;
  housingType: HousingType;
  description: string;
  photos: string[];
  amenityIds: AmenityId[];
  extraAmenityIds: ExtraAmenityId[];
  maxGuestsLabel: string;
  petsLabel: string;
  checkInTime: string;
  checkOutTime: string;
  accessInfoLines: string[];
  houseRulesLines: string[];
  priceTiers: ListingPreviewPriceTier[];
  uniquePrices: ListingPreviewPriceTier[];
};

function pickText(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function splitLines(value: string, fallback: readonly string[]): string[] {
  const lines = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return lines.length > 0 ? lines : [...fallback];
}

function guestsLabel(maxGuests: number, guestsForbidden: boolean): string {
  if (guestsForbidden) {
    return "Запрещено";
  }
  if (maxGuests <= 0) {
    return LISTING_PREVIEW_DEMO.maxGuests > 0
      ? `${LISTING_PREVIEW_DEMO.maxGuests} человека`
      : "—";
  }
  if (maxGuests === 1) {
    return "1 человек";
  }
  if (maxGuests >= 2 && maxGuests <= 4) {
    return `${maxGuests} человека`;
  }
  return `${maxGuests} человек`;
}

function formatUniqueDateLabel(date: IsoDate | ""): string {
  if (date === "") {
    return "Аренда";
  }
  return `Аренда ${formatIsoDateDisplay(date)}`;
}

function uniquePriceTiers(
  listing: Listing,
): ListingPreviewPriceTier[] {
  const fromListing = listing.uniquePrices
    .map((row) => {
      const date = row.date === "" ? null : parseIsoDate(row.date);
      if (date === null || row.base <= 0) {
        return null;
      }
      return { label: formatUniqueDateLabel(date), base: row.base };
    })
    .filter((row): row is ListingPreviewPriceTier => row !== null);

  if (fromListing.length > 0) {
    return fromListing;
  }

  // Демо только когда цены ещё не заполнялись; пустой uniquePrices после мастера — не fallback.
  if (listing.priceNight <= 0 && listing.uniquePrices.length === 0) {
    return LISTING_PREVIEW_DEMO.uniquePrices.map((row) => ({
      label: formatUniqueDateLabel(row.date),
      base: row.base,
    }));
  }

  return [];
}

/** Собирает данные для предпросмотра: черновик мастера, пустые поля — демо из макета. */
export function toListingPreviewDisplay(listing: Listing): ListingPreviewDisplay {
  const useDemoAmenities = listing.amenityIds.length === 0;
  const useDemoExtras = listing.extraAmenityIds.length === 0;
  const priceNight =
    listing.priceNight > 0 ? listing.priceNight : LISTING_PREVIEW_DEMO.priceNight;
  const priceFrom14 =
    listing.priceFrom14 > 0
      ? listing.priceFrom14
      : LISTING_PREVIEW_DEMO.priceFrom14;
  const priceFrom28 =
    listing.priceFrom28 > 0
      ? listing.priceFrom28
      : LISTING_PREVIEW_DEMO.priceFrom28;

  const photos =
    listing.photos.length > 0
      ? listing.photos
      : [...LISTING_PREVIEW_DEMO_PHOTOS];

  return {
    status: listingTableStatusFromApi(listing.status),
    title: pickText(listing.title, LISTING_PREVIEW_DEMO.title),
    address: pickText(listing.address, LISTING_PREVIEW_DEMO.address),
    housingType: listing.housingType || LISTING_PREVIEW_DEMO.housingType,
    description: pickText(listing.description, LISTING_PREVIEW_DEMO.description),
    photos,
    amenityIds: useDemoAmenities
      ? [...LISTING_PREVIEW_DEMO.amenityIds]
      : listing.amenityIds,
    extraAmenityIds: useDemoExtras
      ? [...LISTING_PREVIEW_DEMO.extraAmenityIds]
      : listing.extraAmenityIds,
    maxGuestsLabel: guestsLabel(listing.maxGuests, listing.guestsForbidden),
    petsLabel: (() => {
      const rulesTouched =
        listing.maxGuests > 0 ||
        listing.guestsForbidden ||
        listing.checkInTime.trim().length > 0 ||
        listing.checkOutTime.trim().length > 0;
      if (!rulesTouched) {
        return LISTING_PREVIEW_DEMO.petsAllowed ? "Разрешено" : "Запрещено";
      }
      return listing.petsAllowed ? "Разрешено" : "Запрещено";
    })(),
    checkInTime: pickText(listing.checkInTime, LISTING_PREVIEW_DEMO.checkInTime),
    checkOutTime: pickText(
      listing.checkOutTime,
      LISTING_PREVIEW_DEMO.checkOutTime,
    ),
    accessInfoLines: splitLines(
      listing.accessInfo,
      LISTING_PREVIEW_DEMO.accessInfoLines,
    ),
    houseRulesLines: splitLines(
      listing.houseRules,
      LISTING_PREVIEW_DEMO.houseRulesLines,
    ),
    priceTiers: [
      { label: "Аренда до 14 дней", base: priceNight },
      { label: "Аренда от 14 до 28 дней", base: priceFrom14 },
      { label: "Аренда на 28 дней и более", base: priceFrom28 },
    ],
    uniquePrices: uniquePriceTiers(listing),
  };
}
