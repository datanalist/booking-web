export const LISTING_TABS = [
  { id: "all", label: "Все" },
  { id: "published", label: "Опубликованы" },
  { id: "moderation", label: "На модерации" },
  { id: "archived", label: "Архив" },
] as const;

export type ListingTabId = (typeof LISTING_TABS)[number]["id"];
