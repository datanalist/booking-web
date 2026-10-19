import type { ListingStatus } from "../types";
import type { PbListingStatus } from "./pbTypes";

/** Статусы, которые хозяин может записать сам. `published` и `rejected` ставит модератор. */
export type PbWritableListingStatus = "draft" | "pending" | "archived";

export function listingStatusToPb(status: ListingStatus): PbListingStatus {
  switch (status) {
    case "moderation":
      return "pending";
    case "draft":
    case "published":
    case "archived":
      return status;
  }
}

/** Запись в PB: правка опубликованного объявления уходит на модерацию (`pending`). */
export function listingWritableStatusToPb(status: ListingStatus): PbWritableListingStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "moderation":
    case "published":
      return "pending";
    case "archived":
      return "archived";
  }
}

export function listingStatusFromPb(status: string): ListingStatus {
  switch (status) {
    case "draft":
    case "published":
    case "archived":
      return status;
    case "pending":
      return "moderation";
    case "rejected":
      return "archived";
    default:
      return "archived";
  }
}
