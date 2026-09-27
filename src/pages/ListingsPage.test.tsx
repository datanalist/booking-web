import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ListingsPage } from "./ListingsPage";

vi.mock("../app/session", () => ({
  useSession: () => ({
    listings: {
      list: vi.fn(async () => []),
      remove: vi.fn(async () => undefined),
    },
  }),
}));

afterEach(() => {
  cleanup();
});

test("listings panel matches Figma frame padding and empty state", async () => {
  const { container } = render(
    <MemoryRouter>
      <ListingsPage />
    </MemoryRouter>,
  );

  const panel = container.firstElementChild;
  expect(panel).not.toBeNull();
  expect(panel).toHaveClass("p-8");
  expect(panel).toHaveClass("gap-8");
  expect(panel).toHaveClass("bg-[rgba(251,192,40,0.06)]");
  expect(panel).toHaveClass("h-full");

  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Создать объявление" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Все объявления" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const emptyCard = screen.getByText("Нет объявлений").closest("div.rounded-2xl");
  expect(emptyCard).not.toBeNull();
  expect(emptyCard).toHaveClass("flex-1");
  expect(emptyCard).toHaveClass("border-[rgba(251,192,40,0.17)]");
  expect(emptyCard).toHaveClass("rounded-2xl");
});
