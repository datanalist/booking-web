import { afterEach, describe, expect, test, vi } from "vitest";
import { createApi } from "../index";

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
});

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
