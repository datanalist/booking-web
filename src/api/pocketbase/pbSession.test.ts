import { afterEach, describe, expect, test, vi } from "vitest";
import { SESSION_KEY } from "../keys";
import { PbRequestError } from "./pbClient";
import {
  clearPbToken,
  createCabinetPbClient,
  onPbSessionLost,
  PB_TOKEN_KEY,
  readPbToken,
  writePbToken,
} from "./pbSession";

describe("pb session token", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("пустой storage не возвращает токен", () => {
    expect(readPbToken(new MapStorage())).toBeNull();
  });

  test("запись и очистка используют один ключ", () => {
    const storage = new MapStorage();
    writePbToken(storage, "abc");
    expect(storage.getItem(PB_TOKEN_KEY)).toBe("abc");
    expect(readPbToken(storage)).toBe("abc");
    clearPbToken(storage);
    expect(readPbToken(storage)).toBeNull();
  });

  test("401 с текущим токеном стирает сессию и зовёт слушателя", async () => {
    const storage = new MapStorage();
    writePbToken(storage, "old-token");
    storage.setItem(SESSION_KEY, "{\"userId\":\"user1\"}");
    const lost = vi.fn();
    const stop = onPbSessionLost(lost);
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ message: "expired" }), { status: 401 }));
    const client = createCabinetPbClient(storage);
    await expect(client.getRecord("listings", "x")).rejects.toBeInstanceOf(PbRequestError);
    expect(readPbToken(storage)).toBeNull();
    expect(storage.getItem(SESSION_KEY)).toBeNull();
    expect(lost).toHaveBeenCalledOnce();
    stop();
  });

  test("401 без токена сессию не стирает", async () => {
    const storage = new MapStorage();
    storage.setItem(SESSION_KEY, "{\"userId\":\"user1\"}");
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ message: "no" }), { status: 401 }));
    await expect(createCabinetPbClient(storage).getRecord("listings", "x")).rejects.toBeInstanceOf(PbRequestError);
    expect(storage.getItem(SESSION_KEY)).toBe("{\"userId\":\"user1\"}");
  });

  test("401 со старым токеном не стирает уже новый", async () => {
    const storage = new MapStorage();
    writePbToken(storage, "old-token");
    storage.setItem(SESSION_KEY, "{\"userId\":\"user1\"}");
    vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get("Authorization");
      if (auth === "Bearer old-token") {
        writePbToken(storage, "new-token");
      }
      return new Response(JSON.stringify({ message: "expired" }), { status: 401 });
    });
    await expect(createCabinetPbClient(storage).getRecord("listings", "x")).rejects.toBeInstanceOf(PbRequestError);
    expect(readPbToken(storage)).toBe("new-token");
    expect(storage.getItem(SESSION_KEY)).toBe("{\"userId\":\"user1\"}");
  });

  test("истёкший токен не уходит в запрос и сессия стирается", async () => {
    const storage = new MapStorage();
    writePbToken(storage, jwt({ exp: 1 }));
    storage.setItem(SESSION_KEY, "{\"userId\":\"user1\"}");
    const headers: Array<string | null> = [];
    vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      headers.push(new Headers(init?.headers).get("Authorization"));
      return new Response(JSON.stringify({ page: 1, perPage: 1, totalItems: 0, totalPages: 0, items: [] }), { status: 200 });
    });
    await createCabinetPbClient(storage).listRecords("listings");
    expect(headers).toEqual([null]);
    expect(readPbToken(storage)).toBeNull();
    expect(storage.getItem(SESSION_KEY)).toBeNull();
  });
});

function jwt(payload: object): string {
  const encode = (value: object): string =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
}

class MapStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number { return this.items.size; }
  clear(): void { this.items.clear(); }
  getItem(key: string): string | null { return this.items.get(key) ?? null; }
  key(index: number): string | null { return [...this.items.keys()][index] ?? null; }
  removeItem(key: string): void { this.items.delete(key); }
  setItem(key: string, value: string): void { this.items.set(key, value); }
}
