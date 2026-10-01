import type { ListingTableStatus } from "./listingTableStatus";

export const LISTING_PREVIEW_ACTION_IDS = [
  "edit",
  "delete",
  "unpublish",
  "publish",
  "calendar",
  "archive",
  "submit",
] as const;

export type ListingPreviewActionId =
  (typeof LISTING_PREVIEW_ACTION_IDS)[number];

/**
 * Исчерпывающий набор действий шапки предпросмотра по статусу
 * (макеты Figma 1:20643 / 1:20906 / 1:21165; черновик — мастер).
 */
export function listingPreviewActionsByStatus(
  status: ListingTableStatus,
): readonly ListingPreviewActionId[] {
  switch (status) {
    case "draft":
      return ["edit", "delete", "archive", "submit"];
    case "published":
      return ["edit", "delete", "unpublish", "calendar"];
    case "moderation":
      return ["delete"];
    case "unpublished":
      return ["edit", "delete", "publish"];
  }
}
