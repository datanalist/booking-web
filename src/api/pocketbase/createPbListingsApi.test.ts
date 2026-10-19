import { describe, expect, test, vi } from "vitest";
import { emptyDraft } from "../../lib/emptyDraft";
import { SESSION_KEY } from "../keys";
import { createPbClient } from "./pbClient";
import { createPbListingsApi } from "./createPbListingsApi";

const record = {
  id: "lst1",
  host: "user1",
  title: "У моря",
  city: "Сочи",
  address: "Сочи, ул. Моря 1",
  housing_type: "Квартира",
  placement_type: "apartment",
  description: "Тихо",
  photos: [],
  amenities: [],
  extras: [],
  max_guests: 2,
  guests_forbidden: false,
  pets_allowed: false,
  cancellation_allowed: true,
  check_in_time: "14:00",
  check_out_time: "12:00",
  access_info: "",
  house_rules: "",
  extra_info: "",
  price_night: 1000,
  price_14: 900,
  price_28: 800,
  unique_prices: [],
  status: "draft",
  reject_reason: "",
  rating: 0,
  reviews_count: 0,
  created: "2026-10-01 00:00:00.000Z",
  updated: "2026-10-02 00:00:00.000Z",
};

function storage(): Storage {
  const items = new Map<string, string>([[SESSION_KEY, JSON.stringify({
    userId: "user1", email: "a@b.c", name: "Анна", phone: "+79001234567", onboardingComplete: true,
  })]]);
  return {
    get length() { return items.size; },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => { items.delete(key); },
    setItem: (key, value) => { items.set(key, value); },
  };
}

describe("createPbListingsApi", () => {
  test("list запрашивает объявления текущего хозяина", async () => {
    let url = "";
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input) => {
        url = String(input);
        return new Response(JSON.stringify({ page: 1, perPage: 50, totalItems: 1, totalPages: 1, items: [record] }), { status: 200 });
      },
    });
    const rows = await createPbListingsApi({ client, storage: storage() }).list({ tab: "all", query: "" });
    expect(url).toContain("/api/collections/listings/records");
    expect(url).toContain("user1");
    expect(rows.map((row) => row.id)).toEqual(["lst1"]);
  });

  test("saveDraft со status published бросает INVALID_STATUS до сети", async () => {
    const fetchFn = vi.fn(async () => new Response("{}", { status: 200 }));
    const client = createPbClient({ baseUrl: "https://pb.example", fetchFn });
    const api = createPbListingsApi({ client, storage: storage() });
    await expect(api.saveDraft({
      ...emptyDraft("user1"),
      status: "published",
    })).rejects.toThrow("INVALID_STATUS");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
