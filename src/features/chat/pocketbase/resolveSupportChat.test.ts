import { describe, expect, test } from "vitest";
import { createPbClient } from "../../../api/pocketbase";
import { SUPPORT_STAFF_USER_ID, resolveSupportChatId } from "./resolveSupportChat";

const HOST = "6ekom84sgoqlzmz";
const EXISTING = "gc134dxdyo7je7w";

describe("resolveSupportChatId", () => {
  test("открывает уже существующий чат поддержки и не создаёт второй", async () => {
    const calls = await callsOf(async (_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return listResponse([{
          id: EXISTING,
          kind: "support",
          host: HOST,
          guest: SUPPORT_STAFF_USER_ID,
          staff: SUPPORT_STAFF_USER_ID,
        }]);
      }
      return json({ id: "should-not-create" }, 200);
    });
    const client = calls.client;
    await expect(resolveSupportChatId(client, HOST)).resolves.toBe(EXISTING);
    await expect(resolveSupportChatId(client, ` ${HOST} `)).resolves.toBe(EXISTING);
    expect(calls.posted).toEqual([]);
    const filter = new URL(calls.gets[0] ?? "").searchParams.get("filter");
    expect(filter).toBe(`host="${HOST}" && kind="support"`);
    expect(new URL(calls.gets[0] ?? "").searchParams.get("sort")).toBe("created");
  });

  test("без чата создаёт support: гость и хозяин — текущий пользователь, staff — поддержка", async () => {
    const calls = await callsOf(async (_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return listResponse([]);
      }
      return json({
        id: "newsupport00001",
        kind: "support",
        guest: HOST,
        host: HOST,
        staff: SUPPORT_STAFF_USER_ID,
      }, 200);
    });
    await expect(resolveSupportChatId(calls.client, HOST)).resolves.toBe("newsupport00001");
    expect(calls.posted).toEqual([{
      kind: "support",
      guest: HOST,
      host: HOST,
      staff: SUPPORT_STAFF_USER_ID,
    }]);
  });

  test("если staff правило не пускает, чат всё равно создаётся как support", async () => {
    const calls = await callsOf(async (_input, init) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return listResponse([]);
      }
      const body = JSON.parse(typeof init?.body === "string" ? init.body : "{}") as { staff?: string };
      if (body.staff !== undefined) {
        return json({ message: "staff rejected" }, 400);
      }
      return json({ id: "supportnostaff1", kind: "support", guest: HOST, host: HOST }, 200);
    });
    await expect(resolveSupportChatId(calls.client, HOST)).resolves.toBe("supportnostaff1");
    expect(calls.posted.map((body) => "staff" in body)).toEqual([true, false]);
    expect(calls.posted[1]).toEqual({ kind: "support", guest: HOST, host: HOST });
  });

  test("сбой не 400 не создаёт чат без сотрудника", async () => {
    const calls = await callsOf(async (_input, init) => {
      if ((init?.method ?? "GET") === "GET") {
        return listResponse([]);
      }
      return json({ message: "fail" }, 500);
    });
    await expect(resolveSupportChatId(calls.client, HOST)).rejects.toThrow("fail");
    expect(calls.posted).toHaveLength(1);
    expect(calls.posted[0]?.staff).toBe(SUPPORT_STAFF_USER_ID);
  });

  test("пустой пользователь не ходит в API", async () => {
    const calls = await callsOf(async () => listResponse([]));
    await expect(resolveSupportChatId(calls.client, "  ")).rejects.toThrow(
      "Нет пользователя для чата поддержки",
    );
    expect(calls.gets).toEqual([]);
  });
});

type CallLog = {
  client: ReturnType<typeof createPbClient>;
  gets: string[];
  posted: Record<string, unknown>[];
};

async function callsOf(
  fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): Promise<CallLog> {
  const gets: string[] = [];
  const posted: Record<string, unknown>[] = [];
  const client = createPbClient({
    baseUrl: "https://pb.example",
    fetchFn: async (input, init) => {
      if ((init?.method ?? "GET") === "GET") {
        gets.push(String(input));
      } else if (typeof init?.body === "string") {
        posted.push(JSON.parse(init.body) as Record<string, unknown>);
      }
      return fetchFn(input, init);
    },
  });
  return { client, gets, posted };
}

function listResponse(items: readonly unknown[]): Response {
  return json({
    page: 1,
    perPage: 1,
    totalItems: items.length,
    totalPages: items.length === 0 ? 0 : 1,
    items,
  }, 200);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status });
}
