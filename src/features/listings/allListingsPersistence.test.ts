import { expect, test } from "vitest";
import { ALL_LISTINGS_STORAGE_KEY } from "./allListingsStorageKey";
import { loadAllListingsInitial } from "./loadAllListingsInitial";
import { MOCK_ALL_LISTINGS } from "./mockAllListings";
import { parseListingTableRow } from "./parseListingTableRow";
import { parseListingTableRows } from "./parseListingTableRows";
import { readAllListingsFromStorage } from "./readAllListingsFromStorage";
import { writeAllListingsToStorage } from "./writeAllListingsToStorage";
import { MemoryStorage } from "../../lib/memoryStorage";

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
