import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { AllListingsTable } from "./AllListingsTable";
import { ListingStatusBadge } from "./ListingStatusBadge";

afterEach(() => {
  cleanup();
});

const STATUS_TRACK =
  "grid-cols-[minmax(0,2.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_minmax(max-content,1.2fr)_56px]";

test("бейдж «Снято с публикации» в одну строку", () => {
  render(<ListingStatusBadge status="unpublished" />);

  const badge = screen.getByText("Снято с публикации");
  expect(badge).toHaveClass("whitespace-nowrap");
  expect(badge).toHaveClass("w-max");
  expect(badge).toHaveClass("shrink-0");
});

test("ячейка статуса таблицы вмещает подпись, остальные колонки прежние", () => {
  render(
    <AllListingsTable
      items={[
        {
          id: "unpublished-1",
          title: "Студия",
          address: "Москва",
          housingType: "studio",
          status: "unpublished",
        },
      ]}
      openMenuId={null}
      onOpenMenuChange={() => undefined}
      onMenuAction={() => undefined}
      onOpenListing={() => undefined}
    />,
  );

  const table = screen.getByRole("table", { name: "Все объявления" });
  expect(table).toHaveClass(STATUS_TRACK);
  expect(table).not.toHaveClass(
    "grid-cols-[minmax(0,2.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_56px]",
  );

  const row = screen.getByRole("row", { name: "Открыть объявление Студия" });
  expect(row).toHaveClass("grid-cols-subgrid");

  const cells = within(row).getAllByRole("cell");
  expect(cells[0]).toHaveClass("min-w-0");
  expect(cells[1]).toHaveClass("min-w-0");
  expect(cells[2]).not.toHaveClass("w-max");
  expect(cells[2]).not.toHaveClass("whitespace-nowrap");
  expect(cells[3]).toHaveClass("w-max");
  expect(cells[4]).not.toHaveClass("w-max");

  const badge = within(cells[3]).getByText("Снято с публикации");
  expect(badge).toHaveClass("whitespace-nowrap");
  expect(badge).toHaveClass("w-max");
});
