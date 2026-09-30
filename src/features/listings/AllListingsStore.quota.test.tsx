import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import {
  AllListingsProvider,
  useAllListings,
  type ListingTableRow,
} from "./index";
import { MemoryStorage } from "../../lib/memoryStorage";

afterEach(() => {
  cleanup();
});

const rowWithDataUrl: ListingTableRow = {
  id: "quota-upsert-1",
  title: "Квота студия",
  address: "Москва",
  housingType: "studio",
  status: "draft",
  coverUrl: `data:image/jpeg;base64,${"Q".repeat(8000)}`,
};

function UpsertProbe({ row }: { row: ListingTableRow }) {
  const { upsert, items } = useAllListings();
  const current = items.find((item) => item.id === row.id);
  return (
    <div>
      <button type="button" onClick={() => upsert(row)}>
        Upsert
      </button>
      <pre data-testid="title">{current?.title ?? "missing"}</pre>
      <pre data-testid="cover">{current?.coverUrl ?? "none"}</pre>
    </div>
  );
}

test("upsert survives QuotaExceededError and keeps memory state", async () => {
  const user = userEvent.setup();
  const storage = new MemoryStorage();
  const setItem = vi.spyOn(storage, "setItem").mockImplementation(() => {
    throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
  });

  render(
    <AllListingsProvider storage={storage}>
      <UpsertProbe row={rowWithDataUrl} />
    </AllListingsProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Upsert" }));

  expect(screen.getByTestId("title")).toHaveTextContent("Квота студия");
  expect(screen.getByTestId("cover")).toHaveTextContent("data:image/jpeg");
  expect(setItem).toHaveBeenCalled();
  setItem.mockRestore();
});
