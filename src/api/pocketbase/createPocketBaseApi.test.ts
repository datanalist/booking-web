import { afterEach, describe, expect, test, vi } from "vitest";
import { SESSION_KEY } from "../keys";
import { createApi } from "../index";
import { PB_TOKEN_KEY } from "./pbSession";

describe("createApi data source", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("без флага фабрика остаётся моком и не требует токен", async () => {
    vi.stubEnv("VITE_DATA_SOURCE", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const storage = localStorageMock();
    const api = createApi(storage);
    await expect(api.auth.login("nobody@example.com", "password1")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("флаг pocketbase логинит через переданный fetch, а не через gs.users", async () => {
    vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
    const storage = localStorageMock();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      token: "tok",
      record: {
        id: "user1", email: "host@example.com", verified: true, name: "Анна",
        first_name: "Анна", last_name: "", birthdate: "", phone: "+79001234567",
        avatar: "", limited_browse: false, bio: "", roles: ["host"],
        account_status: "active", verified_host: false, years_hosting: 0,
        rating: 0, reviews_count: 0, balance: 10, created: "", updated: "",
      },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const session = await createApi(storage).auth.login("host@example.com", "password1");
    expect(session.userId).toBe("user1");
    expect(fetchMock).toHaveBeenCalled();
    expect(storage.getItem("gs.users")).toBeNull();
  });

  test("истёкший токен стирает сессию кабинета", () => {
    vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
    const storage = localStorageMock();
    storage.setItem(SESSION_KEY, JSON.stringify({
      userId: "user1",
      email: "host@example.com",
      name: "Анна",
      phone: "+79001234567",
      onboardingComplete: true,
    }));
    storage.setItem(PB_TOKEN_KEY, jwt({ exp: 1_700_000_000 }));
    expect(createApi(storage).readSession()).toBeNull();
    expect(storage.getItem(SESSION_KEY)).toBeNull();
    expect(storage.getItem(PB_TOKEN_KEY)).toBeNull();
  });

  test("токен без срока не стирает сессию", () => {
    vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
    const storage = localStorageMock();
    storage.setItem(SESSION_KEY, JSON.stringify({
      userId: "user1",
      email: "host@example.com",
      name: "Анна",
      phone: "+79001234567",
      onboardingComplete: true,
    }));
    storage.setItem(PB_TOKEN_KEY, "token");
    expect(createApi(storage).readSession()?.userId).toBe("user1");
    expect(storage.getItem(PB_TOKEN_KEY)).toBe("token");
  });
});

function jwt(payload: object): string {
  const encode = (value: object): string =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
}

function localStorageMock(): Storage {
  const items = new Map<string, string>();
  return {
    get length() { return items.size; },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => { items.delete(key); },
    setItem: (key, value) => { items.set(key, value); },
  };
}
