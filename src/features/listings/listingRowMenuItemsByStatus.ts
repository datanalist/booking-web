import type { LucideIcon } from "lucide-react";
import { Calendar, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { ListingTableStatus } from "./listingTableStatus";

export const LISTING_ROW_MENU_ACTION_IDS = [
  "calendar",
  "edit",
  "unpublish",
  "publish",
  "delete",
] as const;

export type ListingRowMenuActionId =
  (typeof LISTING_ROW_MENU_ACTION_IDS)[number];

export type ListingRowMenuItem = {
  id: ListingRowMenuActionId;
  label: string;
  Icon: LucideIcon;
  tone: "default" | "danger";
};

const CALENDAR_ITEM: ListingRowMenuItem = {
  id: "calendar",
  label: "Календарь бронирования",
  Icon: Calendar,
  tone: "default",
};

const EDIT_ITEM: ListingRowMenuItem = {
  id: "edit",
  label: "Редактировать",
  Icon: Pencil,
  tone: "default",
};

const UNPUBLISH_ITEM: ListingRowMenuItem = {
  id: "unpublish",
  label: "Снять с публикации",
  Icon: EyeOff,
  tone: "default",
};

const PUBLISH_ITEM: ListingRowMenuItem = {
  id: "publish",
  label: "Опубликовать",
  Icon: Eye,
  tone: "default",
};

const DELETE_ITEM: ListingRowMenuItem = {
  id: "delete",
  label: "Удалить",
  Icon: Trash2,
  tone: "danger",
};

/** Исчерпывающий набор пунктов меню строки по статусу (макеты 1:19097 / 1:19205 / 1:18991). */
export function listingRowMenuItemsByStatus(
  status: ListingTableStatus,
): readonly ListingRowMenuItem[] {
  switch (status) {
    case "published":
      return [CALENDAR_ITEM, EDIT_ITEM, UNPUBLISH_ITEM, DELETE_ITEM];
    case "moderation":
      return [DELETE_ITEM];
    case "unpublished":
      return [EDIT_ITEM, PUBLISH_ITEM, DELETE_ITEM];
    case "draft":
      return [EDIT_ITEM, DELETE_ITEM];
  }
}
