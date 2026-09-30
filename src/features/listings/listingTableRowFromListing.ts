import type { Listing } from "../../api/types";
import type { ListingTableRow } from "./ListingTableRow";
import { listingTableStatusFromApi } from "./listingTableStatusFromApi";

/** Строка таблицы из сохранённого объявления API. */
export function listingTableRowFromListing(listing: Listing): ListingTableRow {
  const coverUrl = listing.photos[0];
  return {
    id: listing.id,
    title: listing.title,
    address: listing.address,
    housingType: listing.housingType,
    status: listingTableStatusFromApi(listing.status),
    ...(coverUrl !== undefined && coverUrl.trim().length > 0
      ? { coverUrl }
      : {}),
  };
}
