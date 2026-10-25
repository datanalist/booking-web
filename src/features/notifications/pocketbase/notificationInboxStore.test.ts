import { afterEach, expect, test, vi } from "vitest";
import { SESSION_KEY } from "../../../api/keys";
import {
  applyChatNotificationsRead,
  ensureNotificationInbox,
  getNotificationRecords,
  subscribeNotificationRecords,
} from "./notificationInboxStore";

afterEach(() => {
  const stop = subscribeNotificationRecords(() => undefined);
  stop();
  localStorage.removeItem(SESSION_KEY);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("кеш ящика видит прочтение чата и не трогает чужой чат", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: "user1" }));
  vi.stubGlobal("fetch", async () =>
    new Response(JSON.stringify({
      page: 1,
      perPage: 200,
      totalItems: 2,
      totalPages: 1,
      items: [
        {
          id: "n1",
          user: "user1",
          chat: "chat1",
          title: "Своё",
          read: false,
          created: "2026-10-24 12:00:00.000Z",
        },
        {
          id: "n2",
          user: "user1",
          chat: "chat2",
          title: "Чужое",
          read: false,
          created: "2026-10-24 11:00:00.000Z",
        },
      ],
    }), { status: 200 }),
  );
  const stop = await whenInboxLoaded();
  try {
    applyChatNotificationsRead("chat1", "user2");
    expect(getNotificationRecords()?.find((item) => item.id === "n1")?.read).toBe(false);
    applyChatNotificationsRead("chat1", "user1");
    const records = getNotificationRecords();
    expect(records?.find((item) => item.id === "n1")?.read).toBe(true);
    expect(records?.find((item) => item.id === "n2")?.read).toBe(false);
  } finally {
    stop();
  }
});

function whenInboxLoaded(): Promise<() => void> {
  return new Promise((resolve) => {
    const stop = subscribeNotificationRecords(() => {
      if (getNotificationRecords() !== null) {
        resolve(stop);
      }
    });
    ensureNotificationInbox();
  });
}
