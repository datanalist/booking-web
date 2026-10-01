import { expect, test } from "vitest";
import { filterListingsByQuery } from "./filterListingsByQuery";
import { MOCK_ALL_LISTINGS } from "./mockAllListings";

test("empty query returns all items", () => {
  expect(filterListingsByQuery(MOCK_ALL_LISTINGS, "")).toHaveLength(8);
  expect(filterListingsByQuery(MOCK_ALL_LISTINGS, "   ")).toHaveLength(8);
});

test("filters by title case-insensitively", () => {
  const result = filterListingsByQuery(MOCK_ALL_LISTINGS, "СТУДИЯ");
  expect(result).toHaveLength(2);
  expect(result.every((item) => item.title.includes("студия"))).toBe(true);
});

test("filters by address", () => {
  const result = filterListingsByQuery(MOCK_ALL_LISTINGS, "летняя");
  expect(result).toHaveLength(5);
  expect(result.every((item) => item.address.includes("Летняя"))).toBe(true);
});
