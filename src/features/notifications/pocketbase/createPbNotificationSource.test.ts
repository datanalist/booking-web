import { expect, test } from "vitest";
import { createPbClient } from "../../../api/pocketbase";
import { createPbNotificationSource } from "./createPbNotificationSource";

test("list читает коллекцию notifications текущего user по created убыванию", async () => {
  const urls: string[] = [];
  const client = createPbClient({
    baseUrl: "https://pb.example",
    fetchFn: async (input) => {
      urls.push(String(input));
      return new Response(JSON.stringify({
        page: 1,
        perPage: 200,
        totalItems: 1,
        totalPages: 1,
        items: [{
          id: "n1",
          user: "user1",
          title: "Новое сообщение",
          body: "Добрый день",
          read: false,
          created: "2026-10-24 12:00:00.000Z",
          updated: "2026-10-24 12:00:00.000Z",
        }],
      }), { status: 200 });
    },
  });
  const items = await createPbNotificationSource(client).list("user1");
  const url = urls[0] ?? "";
  expect(url).toContain("/api/collections/notifications/records");
  expect(url).toContain("user1");
  expect(decodeURIComponent(url)).toContain("-created");
  expect(items.map((item) => item.id)).toEqual(["n1"]);
  expect(urls).toHaveLength(1);
});

test("list забирает следующие страницы, если totalPages больше 1", async () => {
  const client = createPbClient({
    baseUrl: "https://pb.example",
    fetchFn: async (input) => {
      const page = new URL(String(input)).searchParams.get("page");
      const id = page === "2" ? "n2" : "n1";
      return new Response(JSON.stringify({
        page: Number(page ?? 1),
        perPage: 200,
        totalItems: 2,
        totalPages: 2,
        items: [{ id, user: "user1", title: id, read: false, created: "2026-10-24 12:00:00.000Z" }],
      }), { status: 200 });
    },
  });
  const items = await createPbNotificationSource(client).list("user1");
  expect(items.map((item) => item.id)).toEqual(["n1", "n2"]);
});

test("markRead ставит read true и не отправляет user, title или body", async () => {
  const calls: { url: string; method: string; body: string }[] = [];
  const client = createPbClient({
    baseUrl: "https://pb.example",
    fetchFn: async (input, init) => {
      calls.push({
        url: String(input),
        method: init?.method ?? "GET",
        body: typeof init?.body === "string" ? init.body : "",
      });
      return new Response(JSON.stringify({
        id: "n1",
        user: "user1",
        title: "Новое сообщение",
        body: "Добрый день",
        read: true,
        created: "2026-10-24 12:00:00.000Z",
        updated: "2026-10-24 12:05:00.000Z",
      }), { status: 200 });
    },
  });
  const updated = await createPbNotificationSource(client).markRead("n1");
  expect(calls).toHaveLength(1);
  expect(calls[0]?.method).toBe("PATCH");
  expect(calls[0]?.url).toContain("/api/collections/notifications/records/n1");
  expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ read: true });
  expect(updated.read).toBe(true);
  expect(updated.user).toBe("user1");
});
