import type { ListingStatus } from "../../api/types";
import type { ListingTableStatus } from "./listingTableStatus";

/** Статус строки таблицы → статус API-модели объявления. */
export function listingStatusFromTableStatus(
  status: ListingTableStatus,
): ListingStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "moderation":
      return "moderation";
    case "published":
      return "published";
    case "unpublished":
      return "archived";
  }
}
