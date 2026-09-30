import { expect, test } from "vitest";
import { listingPreviewActionsByStatus } from "./listingPreviewActionsByStatus";
import type { ListingTableStatus } from "./listingTableStatus";

test("preview actions are exhaustive per status", () => {
  const cases: Record<
    ListingTableStatus,
    readonly string[]
  > = {
    draft: ["edit", "delete", "archive", "submit"],
    published: ["edit", "delete", "unpublish", "calendar"],
    moderation: ["delete"],
    unpublished: ["edit", "delete", "publish"],
  };

  for (const status of Object.keys(cases) as ListingTableStatus[]) {
    expect(listingPreviewActionsByStatus(status)).toEqual(cases[status]);
  }
});
