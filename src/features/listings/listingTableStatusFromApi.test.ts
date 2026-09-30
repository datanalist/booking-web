import { expect, test } from "vitest";
import type { ListingStatus } from "../../api/types";
import { listingTableStatusFromApi } from "./listingTableStatusFromApi";
import { listingStatusFromTableStatus } from "./listingStatusFromTableStatus";
import type { ListingTableStatus } from "./listingTableStatus";

test("api status maps to table status", () => {
  const cases: Record<ListingStatus, ListingTableStatus> = {
    draft: "draft",
    moderation: "moderation",
    published: "published",
    archived: "unpublished",
  };
  for (const status of Object.keys(cases) as ListingStatus[]) {
    expect(listingTableStatusFromApi(status)).toBe(cases[status]);
  }
});

test("table status maps to api status", () => {
  const cases: Record<ListingTableStatus, ListingStatus> = {
    draft: "draft",
    moderation: "moderation",
    published: "published",
    unpublished: "archived",
  };
  for (const status of Object.keys(cases) as ListingTableStatus[]) {
    expect(listingStatusFromTableStatus(status)).toBe(cases[status]);
  }
});
