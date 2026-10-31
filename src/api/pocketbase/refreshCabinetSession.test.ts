import { expect, test, vi } from "vitest";
import { SESSION_KEY } from "../keys";
import { PB_TOKEN_KEY } from "./pbSession";
import { refreshCabinetSession } from "./refreshCabinetSession";

function storage(): Storage {
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

test("auth-refresh записывает баланс из PocketBase", async () => {
  const box = storage();
  box.setItem(PB_TOKEN_KEY, "tok");
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify({
    token: "tok-2",
    record: {
      id: "user00000000001",
      email: "host@example.com",
      name: "Анна",
      phone: "+79001234567",
      balance: 40,
    },
  }), { status: 200 }));
  try {
    const session = await refreshCabinetSession(box);
    expect(session.balance).toBe(40);
    expect(box.getItem(PB_TOKEN_KEY)).toBe("tok-2");
    expect(box.getItem(SESSION_KEY)).toContain("40");
  } finally {
    vi.unstubAllGlobals();
  }
});
