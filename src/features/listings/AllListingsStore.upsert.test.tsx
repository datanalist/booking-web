import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test } from "vitest";
import { AllListingsProvider, useAllListings } from "./AllListingsStore";
import type { ListingTableRow } from "./ListingTableRow";

beforeEach(() => {
  localStorage.clear();
});

function wrapper({ children }: { children: ReactNode }) {
  return <AllListingsProvider>{children}</AllListingsProvider>;
}

const BASE_ROW: ListingTableRow = {
  id: "upsert-1",
  title: "Студия",
  address: "Москва",
  housingType: "apartment",
  status: "draft",
  coverUrl: "/data/a.jpg",
};

test("upsert заменяет обложку новой", () => {
  const { result } = renderHook(() => useAllListings(), { wrapper });
  act(() => result.current.upsert(BASE_ROW));
  act(() => result.current.upsert({ ...BASE_ROW, coverUrl: "/data/b.jpg" }));

  expect(result.current.items.find((i) => i.id === "upsert-1")?.coverUrl).toBe(
    "/data/b.jpg",
  );
});

test("upsert без фото убирает старую обложку", () => {
  const { result } = renderHook(() => useAllListings(), { wrapper });
  act(() => result.current.upsert(BASE_ROW));
  const { coverUrl: _omit, ...withoutCover } = BASE_ROW;
  act(() => result.current.upsert(withoutCover));

  const row = result.current.items.find((i) => i.id === "upsert-1");
  expect(row).toBeDefined();
  expect(row?.coverUrl).toBeUndefined();
});
