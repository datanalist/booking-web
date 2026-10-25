import { expect, test } from "vitest";
import type { PbNotificationRecord } from "../../chat/pocketbase";
import {
  buildNotificationInbox,
  filterNotifications,
  formatNotificationReceivedLabel,
  notificationShowsPin,
  sortNotificationsByReceivedTime,
  toNotificationItem,
} from "./notificationInbox";
import type { NotificationItem } from "../domain/notificationItem";

const now = new Date(2026, 9, 25, 15, 0, 0);

function record(patch: Partial<PbNotificationRecord> & Pick<PbNotificationRecord, "id" | "created" | "read">): PbNotificationRecord {
  return {
    user: "user1",
    title: patch.id,
    ...patch,
  };
}

function item(patch: Partial<NotificationItem> & Pick<NotificationItem, "id" | "read" | "receivedAt">): NotificationItem {
  return {
    title: patch.id,
    body: "",
    timeLabel: "",
    ...patch,
  };
}

test("точка есть только у непрочитанного", () => {
  expect(notificationShowsPin({ read: false })).toBe(true);
  expect(notificationShowsPin({ read: true })).toBe(false);
});

test("сортировка по created убывает, как Вчера выше 07.09.24", () => {
  const older = item({ id: "old", read: true, receivedAt: "2024-09-07 12:00:00" });
  const newer = item({ id: "new", read: false, receivedAt: "2026-10-24 12:00:00" });
  expect(sortNotificationsByReceivedTime([older, newer]).map((entry) => entry.id)).toEqual(["new", "old"]);
});

test("непрочитанное лежит во «Все» и «Не прочитанные», прочитанное во «Все» и «Прочитанные»", () => {
  const records = [
    record({ id: "read-1", read: true, created: "2024-09-07 12:00:00", title: "Опубликовано" }),
    record({ id: "unread-1", read: false, created: "2026-10-24 12:00:00", title: "Новое сообщение", body: "Добрый день" }),
  ];
  const all = buildNotificationInbox(records, "all", now);
  const unread = buildNotificationInbox(records, "unread", now);
  const read = buildNotificationInbox(records, "read", now);
  expect(all.map((entry) => entry.id)).toEqual(["unread-1", "read-1"]);
  expect(unread.map((entry) => entry.id)).toEqual(["unread-1"]);
  expect(read.map((entry) => entry.id)).toEqual(["read-1"]);
  expect(notificationShowsPin(unread[0]!)).toBe(true);
  expect(notificationShowsPin(read[0]!)).toBe(false);
  expect(all[0]?.timeLabel).toBe("Вчера");
  expect(all[1]?.timeLabel).toBe("07.09.24");
  expect(all[0]?.body).toBe("Добрый день");
});

test("сегодняшняя дата форматируется как ДД.ММ.ГГ", () => {
  expect(formatNotificationReceivedLabel("2026-10-25 10:00:00", now)).toBe("25.10.26");
  expect(formatNotificationReceivedLabel("битая", now)).toBe("");
});

test("отсутствующий read считается непрочитанным", () => {
  const mapped = toNotificationItem(
    { id: "x", user: "user1", title: "А", created: "2024-09-07 12:00:00" } as PbNotificationRecord,
    now,
  );
  expect(mapped.read).toBe(false);
  expect(filterNotifications([mapped], "unread")).toHaveLength(1);
});
