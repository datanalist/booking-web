export const NOTIFICATION_TABS = [
  { id: "all", label: "Все" },
  { id: "unread", label: "Не прочитанные" },
  { id: "read", label: "Прочитанные" },
] as const;

export type NotificationTabId = (typeof NOTIFICATION_TABS)[number]["id"];

export function parseNotificationTab(value: string | null): NotificationTabId {
  if (value === "unread" || value === "read") {
    return value;
  }
  return "all";
}
