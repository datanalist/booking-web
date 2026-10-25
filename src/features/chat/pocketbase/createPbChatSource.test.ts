import { describe, expect, test, vi } from "vitest";
import { createPbClient } from "../../../api/pocketbase";
import { createPbChatSource } from "./createPbChatSource";

const chat = {
  id: "chat1",
  kind: "listing",
  host: "user1",
  guest: "gst1",
  staff: "",
  listing: "lst1",
  booking: "",
  last_message: "Добрый день",
  last_message_at: "2026-09-10 13:40:00.000Z",
  host_last_read: "",
  created: "2026-09-10 13:00:00.000Z",
  updated: "2026-09-10 13:40:00.000Z",
  expand: {
    guest: { id: "gst1", name: "Екатерина", avatar: "" },
    listing: { id: "lst1", title: "У моря", city: "Сочи", photos: [] },
  },
};

describe("createPbChatSource", () => {
  test("listThreads зовёт коллекцию chats от имени хозяина", async () => {
    const urls: string[] = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input) => {
        urls.push(String(input));
        return new Response(JSON.stringify({
          page: 1, perPage: 50, totalItems: 1, totalPages: 1, items: [chat],
        }), { status: 200 });
      },
    });
    const threads = await createPbChatSource(client).listThreads("user1");
    const url = urls.find((item) => item.includes("/api/collections/chats/records")) ?? "";
    expect(url).toContain("/api/collections/chats/records");
    expect(url).toContain("last_message_at");
    expect(url).toContain("user1");
    expect(threads[0]?.id).toBe("chat1");
    expect(urls.some((item) => item.includes("/api/collections/messages/records"))).toBe(true);
  });

  test("открытие чата не поднимает его выше более нового сообщения", async () => {
    const opened = {
      ...chat,
      id: "opened",
      last_message: "Да, во дворе бесплатно",
      last_message_at: "2026-10-22 13:21:00.000Z",
      updated: "2026-10-22 21:28:00.000Z",
      expand: { guest: { id: "gst-elena", name: "Елена" } },
    };
    const fresh = {
      ...chat,
      id: "fresh",
      last_message: "Подъехали",
      last_message_at: "2026-10-23 00:26:00.000Z",
      updated: "2026-10-23 00:26:00.000Z",
      expand: { guest: { id: "gst-anna", name: "Анна" } },
    };
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input) => {
        const items = String(input).includes("/api/collections/messages/records") ? [] : [opened, fresh];
        return new Response(JSON.stringify({
          page: 1, perPage: 50, totalItems: items.length, totalPages: 1, items,
        }), { status: 200 });
      },
    });
    const threads = await createPbChatSource(client).listThreads("user1");
    expect(threads.map((thread) => thread.id)).toEqual(["fresh", "opened"]);
  });

  test("пустой список чатов не запрашивает messages", async () => {
    const urls: string[] = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input) => {
        urls.push(String(input));
        return new Response(JSON.stringify({
          page: 1, perPage: 50, totalItems: 0, totalPages: 0, items: [],
        }), { status: 200 });
      },
    });
    await expect(createPbChatSource(client).listThreads("user1")).resolves.toEqual([]);
    expect(urls.some((item) => item.includes("/api/collections/messages/records"))).toBe(false);
  });

  test("loadConversation собирает шапку, сообщения и дату", async () => {
    const urls: string[] = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input) => {
        const url = String(input);
        urls.push(url);
        const items = url.includes("/api/collections/messages/records")
          ? [{
            id: "msg1",
            chat: "chat1",
            author: "gst1",
            text: "Добрый день",
            created: "2026-09-10 13:40:00.000Z",
          }]
          : [chat];
        return new Response(JSON.stringify({
          page: 1, perPage: 50, totalItems: 1, totalPages: 1, items,
        }), { status: 200 });
      },
    });
    const model = await createPbChatSource(client).loadConversation("chat1", "user1");
    const chatUrl = urls.find((item) => item.includes("/api/collections/chats/records")) ?? "";
    expect(chatUrl).toContain("chat1");
    expect(chatUrl).toContain("guest");
    expect(urls.some((item) => item.includes("/api/collections/messages/records"))).toBe(true);
    expect(model.heading.kind).toBe("listing");
    expect(model.heading.peerName).toBe("Екатерина");
    expect(model.messages.map((message) => message.kind === "text" ? message.body : "")).toContain(
      "Добрый день",
    );
    expect(model.messages[0]?.receipt).toBe("unread");
    expect(model.dateLabel).toMatch(/10\s+сентября/u);
  });

  test("sendText создаёт messages, markRead обновляет чат", async () => {
    const calls: { url: string; method: string; body: string }[] = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input, init) => {
        calls.push({
          url: String(input),
          method: init?.method ?? "GET",
          body: typeof init?.body === "string" ? init.body : "",
        });
        if ((init?.method ?? "GET") === "GET") {
          return new Response(JSON.stringify({
            page: 1, perPage: 200, totalItems: 0, totalPages: 0, items: [],
          }), { status: 200 });
        }
        return new Response(JSON.stringify({ id: "msg-new" }), { status: 200 });
      },
    });
    const source = createPbChatSource(client);
    await source.sendText("chat1", "user1", "До встречи");
    await source.markRead("chat1", "user1");
    const created = calls.find((call) => call.method === "POST");
    const updated = calls.find((call) => call.method === "PATCH");
    expect(created?.url).toContain("/api/collections/messages/records");
    expect(created?.body).toContain("До встречи");
    expect(created?.body).toContain("user1");
    expect(updated?.url).toContain("/api/collections/chats/records/chat1");
    expect(updated?.body).toContain("host_last_read");
  });

  test("markRead чата снимает непрочитанные уведомления этого чата и не трогает чужие", async () => {
    const calls: { url: string; method: string; body: string }[] = [];
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input, init) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        calls.push({
          url,
          method,
          body: typeof init?.body === "string" ? init.body : "",
        });
        if (method === "GET") {
          const filter = decodeURIComponent(url.replace(/\+/g, " "));
          const scoped = filter.includes('user="user1"')
            && filter.includes('chat="chat1"')
            && filter.includes("read != true");
          const items = scoped
            ? [notice("n-a", "chat1", false), notice("n-b", "chat1", false)]
            : [
                notice("n-a", "chat1", false),
                notice("n-other-chat", "chat-other", false),
                notice("n-read", "chat1", true),
              ];
          return new Response(JSON.stringify({
            page: 1, perPage: 200, totalItems: items.length, totalPages: 1, items,
          }), { status: 200 });
        }
        return new Response(JSON.stringify({ id: "ok", read: true }), { status: 200 });
      },
    });
    await createPbChatSource(client).markRead("chat1", "user1");
    const patches = calls.filter((call) => call.method === "PATCH");
    expect(patches.map((call) => call.url)).toEqual([
      expect.stringContaining("/api/collections/chats/records/chat1"),
      expect.stringContaining("/api/collections/notifications/records/n-a"),
      expect.stringContaining("/api/collections/notifications/records/n-b"),
    ]);
    expect(patches[0]?.body).toContain("host_last_read");
    expect(patches[1]?.body).toBe(JSON.stringify({ read: true }));
    expect(patches[2]?.body).toBe(JSON.stringify({ read: true }));
    expect(patches.some((call) => call.url.includes("n-other-chat") || call.url.includes("n-read"))).toBe(false);
  });

  test("сбой уведомления не откатывает host_last_read и виден в логе", async () => {
    const calls: { url: string; method: string; body: string }[] = [];
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input, init) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        calls.push({
          url,
          method,
          body: typeof init?.body === "string" ? init.body : "",
        });
        if (method === "GET") {
          return new Response(JSON.stringify({
            page: 1,
            perPage: 200,
            totalItems: 2,
            totalPages: 1,
            items: [notice("n-a", "chat1", false), notice("n-b", "chat1", false)],
          }), { status: 200 });
        }
        if (url.includes("/api/collections/notifications/records/n-a")) {
          return new Response(JSON.stringify({ message: "fail" }), { status: 500 });
        }
        return new Response(JSON.stringify({ id: "ok", read: true }), { status: 200 });
      },
    });
    try {
      await expect(createPbChatSource(client).markRead("chat1", "user1")).rejects.toThrow(
        "Не удалось снять уведомления прочитанного чата",
      );
    } finally {
      expect(logged).toHaveBeenCalled();
      expect(String(logged.mock.calls[0]?.[0])).toContain("уведомлен");
      logged.mockRestore();
    }
    const chatPatches = calls.filter((call) => call.method === "PATCH" && call.url.includes("/chats/"));
    expect(chatPatches).toHaveLength(1);
    expect(chatPatches[0]?.body).toContain("host_last_read");
    expect(calls.some((call) => call.url.includes("/notifications/records/n-a"))).toBe(true);
    expect(calls.some((call) => call.url.includes("/notifications/records/n-b"))).toBe(true);
  });
});

function notice(id: string, chatId: string, read: boolean) {
  return {
    id,
    user: "user1",
    chat: chatId,
    title: id,
    read,
    created: "2026-10-24 12:00:00.000Z",
  };
}
