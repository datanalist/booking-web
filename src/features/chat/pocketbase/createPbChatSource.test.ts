import { describe, expect, test } from "vitest";
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
        return new Response(JSON.stringify({ id: "msg-new" }), { status: 200 });
      },
    });
    const source = createPbChatSource(client);
    await source.sendText("chat1", "user1", "До встречи");
    await source.markRead("chat1");
    const created = calls.find((call) => call.method === "POST");
    const updated = calls.find((call) => call.method === "PATCH");
    expect(created?.url).toContain("/api/collections/messages/records");
    expect(created?.body).toContain("До встречи");
    expect(created?.body).toContain("user1");
    expect(updated?.url).toContain("/api/collections/chats/records/chat1");
    expect(updated?.body).toContain("host_last_read");
  });
});
