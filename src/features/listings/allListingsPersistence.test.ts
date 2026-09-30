import { expect, test, vi } from "vitest";
import { ALL_LISTINGS_STORAGE_KEY } from "./allListingsStorageKey";
import { loadAllListingsInitial } from "./loadAllListingsInitial";
import { MOCK_ALL_LISTINGS } from "./mockAllListings";
import { parseListingTableRow } from "./parseListingTableRow";
import { parseListingTableRows } from "./parseListingTableRows";
import { readAllListingsFromStorage } from "./readAllListingsFromStorage";
import { toPersistedListingTableRow } from "./toPersistedListingTableRow";
import { writeAllListingsToStorage } from "./writeAllListingsToStorage";
import { MemoryStorage } from "../../lib/memoryStorage";
import type { ListingTableRow } from "./ListingTableRow";

test("parseListingTableRow accepts a valid row", () => {
  const row = parseListingTableRow(MOCK_ALL_LISTINGS[0]);
  expect(row).toEqual(MOCK_ALL_LISTINGS[0]);
});

test("parseListingTableRow rejects unknown status", () => {
  expect(
    parseListingTableRow({
      ...MOCK_ALL_LISTINGS[0],
      status: "published-ish",
    }),
  ).toBeNull();
});

test("parseListingTableRow drops data-URL cover from bloated storage", () => {
  const parsed = parseListingTableRow({
    ...MOCK_ALL_LISTINGS[0],
    coverUrl: `data:image/jpeg;base64,${"A".repeat(2000)}`,
  });
  expect(parsed).not.toBeNull();
  expect(parsed?.coverUrl).toBeUndefined();
  expect(parsed?.id).toBe(MOCK_ALL_LISTINGS[0]?.id);
});

test("parseListingTableRows rejects array with a broken item", () => {
  expect(parseListingTableRows([MOCK_ALL_LISTINGS[0], { id: 1 }])).toBeNull();
});

test("loadAllListingsInitial seeds mocks when storage is empty", () => {
  const storage = new MemoryStorage();
  const items = loadAllListingsInitial(storage);
  expect(items).toHaveLength(MOCK_ALL_LISTINGS.length);
  expect(storage.getItem(ALL_LISTINGS_STORAGE_KEY)).not.toBeNull();
});

test("loadAllListingsInitial restores previously written rows", () => {
  const storage = new MemoryStorage();
  const custom = [
    {
      id: "created-1",
      title: "Новое жильё",
      address: "Москва",
      housingType: "apartment" as const,
      status: "moderation" as const,
    },
  ];
  writeAllListingsToStorage(storage, custom);
  expect(loadAllListingsInitial(storage)).toEqual(custom);
  expect(readAllListingsFromStorage(storage)).toEqual(custom);
});

test("loadAllListingsInitial migrates bloated data-URL covers to light rows", () => {
  const storage = new MemoryStorage();
  const bloated: ListingTableRow = {
    id: "heavy-1",
    title: "Тяжёлая обложка",
    address: "Москва",
    housingType: "house",
    status: "published",
    coverUrl: `data:image/png;base64,${"B".repeat(5000)}`,
  };
  storage.setItem(ALL_LISTINGS_STORAGE_KEY, JSON.stringify([bloated]));
  const loaded = loadAllListingsInitial(storage);
  expect(loaded).toEqual([
    {
      id: "heavy-1",
      title: "Тяжёлая обложка",
      address: "Москва",
      housingType: "house",
      status: "published",
    },
  ]);
  const raw = storage.getItem(ALL_LISTINGS_STORAGE_KEY);
  expect(raw).not.toBeNull();
  expect(raw).not.toContain("data:");
});

test("writeAllListingsToStorage omits data-URL covers from payload", () => {
  const storage = new MemoryStorage();
  const row: ListingTableRow = {
    id: "with-data-url",
    title: "Студия",
    address: "Москва",
    housingType: "studio",
    status: "draft",
    coverUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
  };
  writeAllListingsToStorage(storage, [row]);
  const raw = storage.getItem(ALL_LISTINGS_STORAGE_KEY);
  expect(raw).not.toBeNull();
  expect(raw).not.toContain("data:");
  expect(JSON.parse(raw ?? "[]")).toEqual([
    toPersistedListingTableRow(row),
  ]);
});

test("writeAllListingsToStorage keeps /data cover urls", () => {
  const storage = new MemoryStorage();
  const row: ListingTableRow = {
    id: "with-data-path",
    title: "Студия",
    address: "Москва",
    housingType: "studio",
    status: "draft",
    coverUrl: "/data/550e8400-e29b-41d4-a716-446655440000.jpg",
  };
  writeAllListingsToStorage(storage, [row]);
  expect(readAllListingsFromStorage(storage)?.[0]?.coverUrl).toBe(
    "/data/550e8400-e29b-41d4-a716-446655440000.jpg",
  );
});

test("writeAllListingsToStorage keeps path covers", () => {
  const storage = new MemoryStorage();
  writeAllListingsToStorage(storage, [MOCK_ALL_LISTINGS[0]!]);
  expect(readAllListingsFromStorage(storage)?.[0]?.coverUrl).toBe(
    "/listings/cover-studio.jpg",
  );
});

test("writeAllListingsToStorage swallows QuotaExceededError", () => {
  const storage = new MemoryStorage();
  const setItem = vi.spyOn(storage, "setItem").mockImplementation(() => {
    throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
  });
  expect(() =>
    writeAllListingsToStorage(storage, [MOCK_ALL_LISTINGS[0]!]),
  ).not.toThrow();
  expect(setItem).toHaveBeenCalled();
  setItem.mockRestore();
});
