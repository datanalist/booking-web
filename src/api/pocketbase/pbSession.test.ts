import { describe, expect, test } from "vitest";
import { clearPbToken, PB_TOKEN_KEY, readPbToken, writePbToken } from "./pbSession";

describe("pb session token", () => {
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
});

class MapStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number { return this.items.size; }
  clear(): void { this.items.clear(); }
  getItem(key: string): string | null { return this.items.get(key) ?? null; }
  key(index: number): string | null { return [...this.items.keys()][index] ?? null; }
  removeItem(key: string): void { this.items.delete(key); }
  setItem(key: string, value: string): void { this.items.set(key, value); }
}
