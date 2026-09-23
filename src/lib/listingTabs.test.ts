import { expect, test } from "vitest";
import { LISTING_TABS } from "./listingTabs";

test("four tabs", () => {
  expect(LISTING_TABS.map((t) => t.id)).toEqual([
    "all",
    "published",
    "moderation",
    "archived",
  ]);
});
