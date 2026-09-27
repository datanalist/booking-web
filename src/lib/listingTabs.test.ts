import { expect, test } from "vitest";
import { LISTING_TABS } from "./listingTabs";

test("four tabs with Figma labels", () => {
  expect(LISTING_TABS.map((t) => t.id)).toEqual([
    "all",
    "published",
    "moderation",
    "archived",
  ]);
  expect(LISTING_TABS.map((t) => t.label)).toEqual([
    "Все объявления",
    "Опубликованы",
    "На модерации",
    "Архив",
  ]);
});
