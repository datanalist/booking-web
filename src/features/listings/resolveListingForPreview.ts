import type { Listing } from "../../api/types";
import { listingFromTableRow } from "./listingFromTableRow";
import { listingPreviewPhotosWithCover } from "./listingPreviewPhotosWithCover";
import { listingStatusFromTableStatus } from "./listingStatusFromTableStatus";
import type { ListingTableRow } from "./ListingTableRow";
import { listingTableStatusFromApi } from "./listingTableStatusFromApi";

/**
 * Предпросмотр: строка AllListingsStore — источник истины для статуса и полей строки.
 * Детали API подмешиваются только если статус API совпадает со статусом строки.
 */
export function resolveListingForPreview(
  tableRow: ListingTableRow | undefined,
  apiListing: Listing | null,
  ownerId: string,
): Listing | null {
  if (tableRow === undefined) {
    return apiListing;
  }

  const apiAligned =
    apiListing !== null &&
    listingTableStatusFromApi(apiListing.status) === tableRow.status;

  const base: Listing = apiAligned
    ? apiListing
    : listingFromTableRow(tableRow, ownerId);

  return {
    ...base,
    id: tableRow.id,
    ownerId: apiListing?.ownerId ?? ownerId,
    title: tableRow.title,
    address: tableRow.address,
    housingType: tableRow.housingType,
    status: listingStatusFromTableStatus(tableRow.status),
    photos: listingPreviewPhotosWithCover(tableRow.coverUrl, base.photos),
  };
}
