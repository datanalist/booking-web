import type { Listing } from "../../api/types";
import { LISTING_PREVIEW_DEMO } from "./listingPreviewDemo";
import { LISTING_PREVIEW_DEMO_PHOTOS } from "./listingPreviewDemoPhotos";
import type { ListingTableRow } from "./ListingTableRow";
import { listingStatusFromTableStatus } from "./listingStatusFromTableStatus";

function photosForRow(coverUrl: string | undefined): string[] {
  const demo = [...LISTING_PREVIEW_DEMO_PHOTOS];
  if (coverUrl === undefined || coverUrl.trim().length === 0) {
    return demo;
  }
  return [coverUrl, ...demo.slice(1)];
}

/**
 * Собирает полную модель объявления из строки таблицы + демо-полей макета,
 * когда записи ещё нет в listings API (мок-строки «Мои объявления»).
 */
export function listingFromTableRow(
  row: ListingTableRow,
  ownerId: string,
): Listing {
  return {
    id: row.id,
    ownerId,
    status: listingStatusFromTableStatus(row.status),
    title: row.title,
    address: row.address,
    housingType: row.housingType,
    description: LISTING_PREVIEW_DEMO.description,
    photos: photosForRow(row.coverUrl),
    amenityIds: [...LISTING_PREVIEW_DEMO.amenityIds],
    extraAmenityIds: [...LISTING_PREVIEW_DEMO.extraAmenityIds],
    maxGuests: LISTING_PREVIEW_DEMO.maxGuests,
    guestsForbidden: false,
    petsAllowed: LISTING_PREVIEW_DEMO.petsAllowed,
    cancellationAllowed: false,
    checkInTime: LISTING_PREVIEW_DEMO.checkInTime,
    checkOutTime: LISTING_PREVIEW_DEMO.checkOutTime,
    accessInfo: LISTING_PREVIEW_DEMO.accessInfoLines.join("\n"),
    houseRules: LISTING_PREVIEW_DEMO.houseRulesLines.join("\n"),
    extraInfo: "",
    priceNight: LISTING_PREVIEW_DEMO.priceNight,
    priceFrom14: LISTING_PREVIEW_DEMO.priceFrom14,
    priceFrom28: LISTING_PREVIEW_DEMO.priceFrom28,
    uniquePrices: LISTING_PREVIEW_DEMO.uniquePrices.map((rowPrice) => ({
      date: rowPrice.date,
      base: rowPrice.base,
    })),
    updatedAt: new Date().toISOString(),
  };
}
