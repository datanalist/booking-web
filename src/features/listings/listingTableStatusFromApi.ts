import type { ListingStatus } from "../../api/types";
import type { ListingTableStatus } from "./listingTableStatus";

/** API `archived` в таблице показывается как «Снято с публикации». */
export function listingTableStatusFromApi(
  status: ListingStatus,
): ListingTableStatus {
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
