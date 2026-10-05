import type { HousingType } from "../../api/types";
import { HOUSING_LABELS } from "../../config";
import type { ListingTableRow } from "./ListingTableRow";
import { parseListingTableStatus } from "./parseListingTableStatus";
import { parsePersistedCoverUrl } from "./parsePersistedCoverUrl";

const HOUSING_TYPES: ReadonlySet<string> = new Set(Object.keys(HOUSING_LABELS));

function isHousingType(value: string): value is HousingType {
  return HOUSING_TYPES.has(value);
}

/** Разбирает одну строку таблицы объявлений; битые данные → null. */
export function parseListingTableRow(value: unknown): ListingTableRow | null {
  if (value === null || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.trim().length === 0) {
    return null;
  }
  if (typeof record.title !== "string") {
    return null;
  }
  if (typeof record.address !== "string") {
    return null;
  }
  if (typeof record.housingType !== "string" || !isHousingType(record.housingType)) {
    return null;
  }
  const status = parseListingTableStatus(record.status);
  if (status === null) {
    return null;
  }
  const coverUrl = parsePersistedCoverUrl(record.coverUrl);
  return {
    id: record.id,
    title: record.title,
    address: record.address,
    housingType: record.housingType,
    status,
    ...(coverUrl !== undefined ? { coverUrl } : {}),
  };
}
