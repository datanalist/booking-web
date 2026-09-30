import { isDataUrl } from "./isDataUrl";
import type { ListingTableRow } from "./ListingTableRow";

/**
 * Лёгкая строка для Storage: без data-URL обложек (base64 раздувает квоту ~5 МБ).
 */
export function toPersistedListingTableRow(
  row: ListingTableRow,
): ListingTableRow {
  const coverUrl = row.coverUrl;
  if (coverUrl === undefined || coverUrl.trim().length === 0 || isDataUrl(coverUrl)) {
    return {
      id: row.id,
      title: row.title,
      address: row.address,
      housingType: row.housingType,
      status: row.status,
    };
  }
  return {
    id: row.id,
    title: row.title,
    address: row.address,
    housingType: row.housingType,
    status: row.status,
    coverUrl,
  };
}
