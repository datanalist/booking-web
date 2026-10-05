import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  AllListingsProvider,
  ALL_LISTINGS_STORAGE_KEY,
  useAllListings,
  type ListingTableRow,
} from "../features/listings";
import { ListingsPage } from "./ListingsPage";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function SeedAndList({ row }: { row: ListingTableRow }) {
  const { upsert } = useAllListings();
  return (
    <>
      <button type="button" onClick={() => upsert(row)}>
        Создать в таблице
      </button>
      <ListingsPage />
    </>
  );
}

const createdRow: ListingTableRow = {
  id: "created-persist-1",
  title: "Созданная студия у парка",
  address: "Москва, ул. Тестовая 1",
  housingType: "studio",
  status: "moderation",
  coverUrl: "/listings/cover-studio.jpg",
};

test("created listing remains after remounting AllListingsProvider", async () => {
  const user = userEvent.setup();
  const first = render(
    <MemoryRouter initialEntries={["/listings"]}>
      <AllListingsProvider>
        <Routes>
          <Route path="/listings" element={<SeedAndList row={createdRow} />} />
        </Routes>
      </AllListingsProvider>
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "Создать в таблице" }));
  const table = await screen.findByRole("table", { name: "Все объявления" });
  expect(
    within(table).getByText("Созданная студия у парка"),
  ).toBeInTheDocument();
  expect(localStorage.getItem(ALL_LISTINGS_STORAGE_KEY)).toContain(
    "created-persist-1",
  );

  first.unmount();

  render(
    <MemoryRouter initialEntries={["/listings"]}>
      <AllListingsProvider>
        <Routes>
          <Route path="/listings" element={<ListingsPage />} />
        </Routes>
      </AllListingsProvider>
    </MemoryRouter>,
  );

  const restored = await screen.findByRole("table", {
    name: "Все объявления",
  });
  expect(
    within(restored).getByText("Созданная студия у парка"),
  ).toBeInTheDocument();
});

test("status change survives remount", async () => {
  const user = userEvent.setup();

  function Mutate() {
    const { upsert, setStatus, items } = useAllListings();
    const current = items.find((item) => item.id === createdRow.id);
    return (
      <div>
        <button type="button" onClick={() => upsert(createdRow)}>
          Создать
        </button>
        <button
          type="button"
          onClick={() => setStatus(createdRow.id, "published")}
        >
          Опубликовать
        </button>
        <pre data-testid="status-dump">{current?.status ?? "missing"}</pre>
      </div>
    );
  }

  const first = render(
    <AllListingsProvider>
      <Mutate />
    </AllListingsProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Создать" }));
  expect(await screen.findByTestId("status-dump")).toHaveTextContent(
    "moderation",
  );
  await user.click(screen.getByRole("button", { name: "Опубликовать" }));
  expect(screen.getByTestId("status-dump")).toHaveTextContent("published");
  const storedRaw = localStorage.getItem(ALL_LISTINGS_STORAGE_KEY);
  expect(storedRaw).not.toBeNull();
  const storedRows = JSON.parse(storedRaw ?? "[]") as ListingTableRow[];
  expect(storedRows.find((row) => row.id === createdRow.id)?.status).toBe(
    "published",
  );
  first.unmount();

  function ReadBack() {
    const { items } = useAllListings();
    return (
      <pre data-testid="status-dump">
        {items.find((item) => item.id === createdRow.id)?.status ?? "missing"}
      </pre>
    );
  }

  render(
    <AllListingsProvider>
      <ReadBack />
    </AllListingsProvider>,
  );

  expect(screen.getByTestId("status-dump")).toHaveTextContent("published");
});
