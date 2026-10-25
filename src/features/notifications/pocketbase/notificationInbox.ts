import type { PbNotificationRecord } from "../../chat/pocketbase";
import type { NotificationItem } from "../domain/notificationItem";
import type { NotificationTabId } from "../domain/notificationTab";

export function notificationShowsPin(item: { readonly read: boolean }): boolean {
  return item.read !== true;
}

export function sortNotificationsByReceivedTime(
  items: readonly NotificationItem[],
): NotificationItem[] {
  return [...items].sort((left, right) => {
    const leftTime = receivedMillis(left.receivedAt);
    const rightTime = receivedMillis(right.receivedAt);
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    return compareIdDescending(left.id, right.id);
  });
}

export function filterNotifications(
  items: readonly NotificationItem[],
  tab: NotificationTabId,
): NotificationItem[] {
  if (tab === "unread") {
    return items.filter((entry) => entry.read !== true);
  }
  if (tab === "read") {
    return items.filter((entry) => entry.read === true);
  }
  return [...items];
}

export function formatNotificationReceivedLabel(iso: string, now: Date): string {
  const date = parsePbDate(iso);
  if (date === null) {
    return "";
  }
  if (isPreviousCalendarDay(date, now)) {
    return "Вчера";
  }
  return formatDayMonthYear(date);
}

export function toNotificationItem(record: PbNotificationRecord, now: Date): NotificationItem {
  return {
    id: record.id,
    title: record.title,
    body: record.body ?? "",
    read: record.read === true,
    receivedAt: record.created,
    timeLabel: formatNotificationReceivedLabel(record.created, now),
  };
}

export function buildNotificationInbox(
  records: readonly PbNotificationRecord[],
  tab: NotificationTabId,
  now: Date,
): NotificationItem[] {
  const items = records.map((record) => toNotificationItem(record, now));
  return filterNotifications(sortNotificationsByReceivedTime(items), tab);
}

function receivedMillis(iso: string): number {
  const date = parsePbDate(iso);
  return date === null ? Number.NEGATIVE_INFINITY : date.getTime();
}

function compareIdDescending(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  return left < right ? 1 : -1;
}

function isPreviousCalendarDay(date: Date, now: Date): boolean {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return date.getFullYear() === yesterday.getFullYear()
    && date.getMonth() === yesterday.getMonth()
    && date.getDate() === yesterday.getDate();
}

function formatDayMonthYear(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

function parsePbDate(value: string): Date | null {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}
