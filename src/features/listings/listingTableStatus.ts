/** Статусы строки таблицы «Все объявления» (отображение, не API). */

export const LISTING_TABLE_STATUSES = [
  "moderation",
  "published",
  "unpublished",
] as const;

export type ListingTableStatus = (typeof LISTING_TABLE_STATUSES)[number];

export const LISTING_TABLE_STATUS_LABELS: Record<ListingTableStatus, string> = {
  moderation: "На модерации",
  published: "Опубликовано",
  unpublished: "Снято с публикации",
};

export const LISTING_TABLE_STATUS_BADGE_CLASS: Record<
  ListingTableStatus,
  string
> = {
  moderation: "bg-indigo-600/25",
  published: "bg-green-500/30",
  unpublished: "bg-amber-400/20",
};
