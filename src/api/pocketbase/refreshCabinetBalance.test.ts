import { expect, test, vi } from "vitest";
import { SESSION_KEY } from "../keys";
import { PB_TOKEN_KEY } from "./pbSession";
import {
  bumpCabinetBalanceEpoch,
  refreshCabinetBalance,
} from "./refreshCabinetBalance";

const USER_ID = "user00000000001";

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

function session(balance: number, name = "Анна"): string {
  return JSON.stringify({
    userId: USER_ID,
    email: "host@example.com",
    name,
    phone: "+79001234567",
    onboardingComplete: true,
    balance,
  });
}

test("подставляет users.balance и оставляет имя из сессии", async () => {
  const box = storage();
  box.setItem(PB_TOKEN_KEY, "tok");
  box.setItem(SESSION_KEY, session(0));
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify({
    id: USER_ID,
    email: "host@example.com",
    name: "Другое имя",
    phone: "+79001234567",
    balance: 4500,
  }), { status: 200 }));
  try {
    const next = await refreshCabinetBalance(box);
    expect(next.balance).toBe(4500);
    expect(next.name).toBe("Анна");
    expect(box.getItem(SESSION_KEY)).toContain("4500");
    expect(box.getItem(SESSION_KEY)).toContain("Анна");
  } finally {
    vi.unstubAllGlobals();
  }
});

test("ответ, начатый до оплаты, не затирает уже записанный баланс", async () => {
  const box = storage();
  box.setItem(PB_TOKEN_KEY, "tok");
  box.setItem(SESSION_KEY, session(0));
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.stubGlobal("fetch", async () => {
    await gate;
    return new Response(JSON.stringify({
      id: USER_ID,
      email: "host@example.com",
      name: "Анна",
      phone: "+79001234567",
      balance: 0,
    }), { status: 200 });
  });
  try {
    const pending = refreshCabinetBalance(box);
    bumpCabinetBalanceEpoch();
    box.setItem(SESSION_KEY, session(4500, "Мария"));
    release();
    const next = await pending;
    expect(next.balance).toBe(4500);
    expect(next.name).toBe("Мария");
  } finally {
    vi.unstubAllGlobals();
  }
});
