import { expect, test, vi } from "vitest";
import { createListingsApi } from "./listings";
import { LISTINGS_KEY } from "./keys";
import { emptyDraft } from "../lib/emptyDraft";
import { MemoryStorage } from "../lib/memoryStorage";

function setup() {
  const storage = new MemoryStorage();
  const api = createListingsApi(storage, () => "u1");
  return { api, storage };
}

test("step1 draft appears in all, not in moderation", async () => {
  const { api } = setup();
  const draft = emptyDraft("u1");
  draft.title = "Студия";
  draft.address = "Москва";
  draft.housingType = "apartment";
  draft.description = "Текст";
  const saved = await api.saveDraft(draft);
  expect(saved.status).toBe("draft");
  const all = await api.list({ tab: "all", query: "" });
  const mod = await api.list({ tab: "moderation", query: "" });
  expect(all).toHaveLength(1);
  expect(mod).toHaveLength(0);
});

test("submit then edit keeps moderation", async () => {
  const { api } = setup();
  const saved = await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  await api.submitForModeration(saved.id);
  const edited = await api.saveDraft({ ...(await api.get(saved.id)), title: "A2" });
  expect(edited.status).toBe("moderation");
  const again = await api.submitForModeration(saved.id);
  expect(again.status).toBe("moderation");
});

test("archive then submit returns to moderation", async () => {
  const { api } = setup();
  const saved = await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  await api.submitForModeration(saved.id);
  await api.archive(saved.id);
  const archived = await api.list({ tab: "archived", query: "" });
  expect(archived).toHaveLength(1);
  await api.submitForModeration(saved.id);
  expect((await api.get(saved.id)).status).toBe("moderation");
});

test("search is case-insensitive on title and address", async () => {
  const { api } = setup();
  await api.saveDraft({ ...emptyDraft("u1"), title: "Студия", address: "Невская", housingType: "apartment", description: "C" });
  expect(await api.list({ tab: "all", query: "студ" })).toHaveLength(1);
  expect(await api.list({ tab: "all", query: "невск" })).toHaveLength(1);
  expect(await api.list({ tab: "all", query: "питер" })).toHaveLength(0);
});

test("never writes published; published tab empty", async () => {
  const { api } = setup();
  await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  expect(await api.list({ tab: "published", query: "" })).toHaveLength(0);
});

test("saveDraft rejects an existing published listing without writing", async () => {
  const { api, storage } = setup();
  const published = {
    ...emptyDraft("u1"),
    id: "published-1",
    status: "published" as const,
    updatedAt: "2026-09-20T00:00:00.000Z",
  };
  const stored = JSON.stringify([published]);
  storage.setItem(LISTINGS_KEY, stored);

  await expect(api.saveDraft({ ...published, status: "draft" })).rejects.toThrow("INVALID_STATUS");
  expect(storage.getItem(LISTINGS_KEY)).toBe(stored);
});

test("saveDraft rejects an incoming published status without writing", async () => {
  const { api, storage } = setup();

  await expect(api.saveDraft({
    ...emptyDraft("u1"),
    status: "published",
  })).rejects.toThrow("INVALID_STATUS");
  expect(storage.getItem(LISTINGS_KEY)).toBeNull();
});

test("remove deletes", async () => {
  const { api } = setup();
  const saved = await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  await api.remove(saved.id);
  await expect(api.get(saved.id)).rejects.toThrow();
});

test("ensureForEdit creates draft with given id and is idempotent", async () => {
  const { api } = setup();
  const seeded = await api.ensureForEdit({
    id: "mock-2",
    title: "Частный дом",
    address: "Лесной",
    housingType: "house",
  });
  expect(seeded.id).toBe("mock-2");
  expect(seeded.status).toBe("draft");
  expect(seeded.title).toBe("Частный дом");
  expect(await api.get("mock-2")).toEqual(seeded);

  const again = await api.ensureForEdit({
    id: "mock-2",
    title: "Другое",
    address: "Иное",
    housingType: "apartment",
  });
  expect(again).toEqual(seeded);
});

test("saveDraft throws QUOTA_EXCEEDED without crashing when setItem fails", async () => {
  const { api, storage } = setup();
  const setItem = vi.spyOn(storage, "setItem").mockImplementation(() => {
    throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
  });

  await expect(
    api.saveDraft({
      ...emptyDraft("u1"),
      title: "A",
      address: "B",
      housingType: "apartment",
      description: "C",
    }),
  ).rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });

  setItem.mockRestore();
});
