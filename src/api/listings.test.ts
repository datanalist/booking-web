import { expect, test } from "vitest";
import { createListingsApi } from "./listings";
import { emptyDraft } from "../lib/emptyDraft";
import { MemoryStorage } from "../lib/memoryStorage";

function setup() {
  const storage = new MemoryStorage();
  const api = createListingsApi(storage, () => "u1");
  return { api };
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

test("remove deletes", async () => {
  const { api } = setup();
  const saved = await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  await api.remove(saved.id);
  await expect(api.get(saved.id)).rejects.toThrow();
});
