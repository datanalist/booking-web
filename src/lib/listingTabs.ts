export const LISTING_TABS = [
  { id: "all", label: "Все объявления" },
  { id: "published", label: "Опубликованы" },
  { id: "moderation", label: "На модерации" },
  { id: "archived", label: "Архив" },
] as const;

export type ListingTabId = (typeof LISTING_TABS)[number]["id"];

/** state навигации на `/listings` (вкладка после архива / модерации). */
export type ListingsLocationState = {
  tab?: ListingTabId;
};

export function isListingTabId(value: unknown): value is ListingTabId {
  return (
    typeof value === "string" &&
    LISTING_TABS.some((item) => item.id === value)
  );
}
