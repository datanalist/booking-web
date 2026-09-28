import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "../app/session";
import { AllListingsProvider } from "../features/listings";
import { ListingPreviewPage } from "./ListingPreviewPage";
import { ListingsPage } from "./ListingsPage";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPage() {
  return render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/listings"]}>
        <AllListingsProvider>
          <Routes>
            <Route path="/listings" element={<ListingsPage />} />
            <Route
              path="/listings/:id/edit"
              element={
                <div data-testid="edit-flow">
                  <p>Редактирование</p>
                  <Link to="/listings">Назад к списку</Link>
                </div>
              }
            />
            <Route
              path="/listings/:id/preview"
              element={<ListingPreviewPage />}
            />
          </Routes>
        </AllListingsProvider>
      </MemoryRouter>
    </SessionProvider>,
  );
}

/** Индексы mockAllListings на вкладке «Все»: 0 moderation, 1 published, 2 unpublished. */
async function openMenuAt(index: number): Promise<HTMLElement> {
  const user = userEvent.setup();
  const buttons = screen.getAllByRole("button", { name: /Действия для/ });
  const button = buttons[index];
  if (!button) {
    throw new Error(`Menu button at index ${index} not found`);
  }
  await user.click(button);
  return screen.getByRole("menu", { name: "Действия с объявлением" });
}

test("all listings tab shows eight mock rows by default", async () => {
  const { container } = renderPage();

  const panel = container.firstElementChild;
  expect(panel).toHaveClass("p-8");
  expect(panel).toHaveClass("gap-8");
  expect(panel).toHaveClass("bg-amber-400/5");

  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("tab", { name: "Все объявления" }),
  ).toHaveAttribute("aria-selected", "true");

  const table = screen.getByRole("table", { name: "Все объявления" });
  expect(within(table).getAllByRole("row")).toHaveLength(9);
  expect(within(table).getByText("Апартаменты для семьи")).toBeInTheDocument();
});

test("tabs filter the shared in-memory list by status", async () => {
  const user = userEvent.setup();
  renderPage();

  await user.click(screen.getByRole("tab", { name: "Опубликованы" }));
  const publishedTable = screen.getByRole("table", { name: "Опубликованы" });
  expect(within(publishedTable).getAllByRole("row")).toHaveLength(5);
  expect(
    within(publishedTable).getByText("Апартаменты для семьи"),
  ).toBeInTheDocument();
  expect(
    within(publishedTable).queryByText("На модерации"),
  ).not.toBeInTheDocument();
  expect(
    within(publishedTable).queryByText("Снято с публикации"),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "На модерации" }));
  const moderationTable = screen.getByRole("table", { name: "На модерации" });
  expect(within(moderationTable).getAllByRole("row")).toHaveLength(3);
  expect(
    within(moderationTable).getAllByText("На модерации").length,
  ).toBeGreaterThanOrEqual(2);

  await user.click(screen.getByRole("tab", { name: "Архив" }));
  const archiveTable = screen.getByRole("table", { name: "Архив" });
  expect(within(archiveTable).getAllByRole("row")).toHaveLength(3);
  expect(
    within(archiveTable).getAllByText("Снято с публикации"),
  ).toHaveLength(2);
});

test("published row menu shows calendar edit unpublish and red delete", async () => {
  renderPage();

  const menu = await openMenuAt(1);
  const items = within(menu).getAllByRole("menuitem");
  expect(items.map((item) => item.textContent)).toEqual([
    "Календарь бронирования",
    "Редактировать",
    "Снять с публикации",
    "Удалить",
  ]);
  expect(within(menu).queryByRole("menuitem", { name: "Опубликовать" })).toBeNull();
  expect(screen.getByRole("menuitem", { name: "Удалить" })).toHaveClass(
    "text-red-500",
  );
});

test("moderation row menu shows only red delete", async () => {
  renderPage();

  const menu = await openMenuAt(0);
  const items = within(menu).getAllByRole("menuitem");
  expect(items.map((item) => item.textContent)).toEqual(["Удалить"]);
  expect(
    within(menu).queryByRole("menuitem", { name: "Редактировать" }),
  ).toBeNull();
  expect(
    within(menu).queryByRole("menuitem", {
      name: "Календарь бронирования",
    }),
  ).toBeNull();
  expect(items[0]).toHaveClass("text-red-500");
});

test("unpublished row menu shows edit publish and red delete", async () => {
  renderPage();

  const menu = await openMenuAt(2);
  const items = within(menu).getAllByRole("menuitem");
  expect(items.map((item) => item.textContent)).toEqual([
    "Редактировать",
    "Опубликовать",
    "Удалить",
  ]);
  expect(
    within(menu).queryByRole("menuitem", {
      name: "Календарь бронирования",
    }),
  ).toBeNull();
  expect(
    within(menu).queryByRole("menuitem", { name: "Снять с публикации" }),
  ).toBeNull();
  expect(screen.getByRole("menuitem", { name: "Удалить" })).toHaveClass(
    "text-red-500",
  );
});

test("only one row menu is open and closes on repeat outside and Escape", async () => {
  const user = userEvent.setup();
  renderPage();

  const buttons = screen.getAllByRole("button", { name: /Действия для/ });
  const first = buttons[0]!;
  const second = buttons[1]!;

  await user.click(first);
  expect(screen.getAllByRole("menu")).toHaveLength(1);
  expect(first).toHaveAttribute("aria-expanded", "true");

  await user.click(second);
  expect(screen.getAllByRole("menu")).toHaveLength(1);
  expect(first).toHaveAttribute("aria-expanded", "false");
  expect(second).toHaveAttribute("aria-expanded", "true");

  await user.click(second);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();

  await user.click(second);
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.click(screen.getByRole("heading", { name: "Мои объявления" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();

  await user.click(second);
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("calendar closes menu without dialog or navigation", async () => {
  const user = userEvent.setup();
  renderPage();

  await openMenuAt(1);
  await user.click(
    screen.getByRole("menuitem", { name: "Календарь бронирования" }),
  );
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByTestId("edit-flow")).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
});

test("edit navigates to listing edit flow", async () => {
  const user = userEvent.setup();
  renderPage();

  await openMenuAt(1);
  await user.click(screen.getByRole("menuitem", { name: "Редактировать" }));
  expect(screen.getByTestId("edit-flow")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Мои объявления" }),
  ).not.toBeInTheDocument();
});

test("edit after delete keeps deleted row gone on return", async () => {
  const user = userEvent.setup();
  renderPage();

  const deletedTitle = "Апартаменты для семьи";
  const editTitle = "Частный дом в 10 км от Москвы";

  const deleteButton = screen.getByRole("button", {
    name: `Действия для «${deletedTitle}»`,
  });
  await user.click(deleteButton);
  await user.click(screen.getByRole("menuitem", { name: "Удалить" }));
  await user.click(screen.getByRole("button", { name: "Да, удалить" }));

  const table = screen.getByRole("table", { name: "Все объявления" });
  expect(within(table).getAllByRole("row")).toHaveLength(8);
  expect(within(table).queryByText(deletedTitle)).not.toBeInTheDocument();

  const editButton = screen.getAllByRole("button", {
    name: `Действия для «${editTitle}»`,
  })[0];
  if (!editButton) {
    throw new Error("Edit menu button not found");
  }
  await user.click(editButton);
  await user.click(screen.getByRole("menuitem", { name: "Редактировать" }));
  expect(screen.getByTestId("edit-flow")).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Мои объявления" }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("link", { name: "Назад к списку" }));
  const tableAfter = screen.getByRole("table", { name: "Все объявления" });
  expect(within(tableAfter).getAllByRole("row")).toHaveLength(8);
  expect(within(tableAfter).queryByText(deletedTitle)).not.toBeInTheDocument();
  expect(
    within(tableAfter).getAllByText(editTitle).length,
  ).toBeGreaterThanOrEqual(1);
});

test("row menu is portaled left of trigger with 3px gap", async () => {
  const user = userEvent.setup();
  renderPage();

  const buttons = screen.getAllByRole("button", { name: /Действия для/ });
  const trigger = buttons[1];
  if (!trigger) {
    throw new Error("Menu button at index 1 not found");
  }

  const triggerRect = {
    x: 400,
    y: 120,
    left: 400,
    top: 120,
    right: 424,
    bottom: 140,
    width: 24,
    height: 20,
    toJSON() {
      return {};
    },
  } satisfies DOMRect;
  const firstDot = trigger.querySelector("span > span");
  expect(firstDot).not.toBeNull();
  const firstDotRect = {
    x: 410,
    y: 122,
    left: 410,
    top: 122,
    right: 413,
    bottom: 125,
    width: 3,
    height: 3,
    toJSON() {
      return {};
    },
  } satisfies DOMRect;

  trigger.getBoundingClientRect = () => triggerRect;
  (firstDot as HTMLElement).getBoundingClientRect = () => firstDotRect;

  await user.click(trigger);

  const menu = screen.getByRole("menu", { name: "Действия с объявлением" });
  expect(menu.parentElement).toBe(document.body);
  expect(menu).toHaveStyle({ position: "fixed" });
  expect(menu.style.top).toBe("122px");
  expect(menu.style.right).toBe(`${window.innerWidth - 400 + 3}px`);
});

test("last row menu opens via portal outside table overflow", async () => {
  const user = userEvent.setup();
  renderPage();

  const buttons = screen.getAllByRole("button", { name: /Действия для/ });
  const last = buttons[buttons.length - 1];
  if (!last) {
    throw new Error("Last menu button not found");
  }
  await user.click(last);

  const menu = screen.getByRole("menu", { name: "Действия с объявлением" });
  const table = screen.getByRole("table", { name: "Все объявления" });
  expect(menu.parentElement).toBe(document.body);
  expect(table.contains(menu)).toBe(false);
});

test("delete dialog cancels without removing and confirms removes row", async () => {
  const user = userEvent.setup();
  renderPage();

  const table = screen.getByRole("table", { name: "Все объявления" });
  expect(within(table).getAllByRole("row")).toHaveLength(9);

  await openMenuAt(0);
  await user.click(screen.getByRole("menuitem", { name: "Удалить" }));

  const dialog = await screen.findByRole("dialog");
  expect(
    within(dialog).getByRole("heading", { name: "Удалить объявление?" }),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByRole("button", { name: "Да, удалить" }),
  ).toHaveClass("whitespace-nowrap");

  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(table).getAllByRole("row")).toHaveLength(9);
  expect(
    within(table).getAllByText("Уютная студия в центре Москвы").length,
  ).toBeGreaterThanOrEqual(1);
  expect(within(table).getAllByRole("img")[0]).toHaveAttribute(
    "src",
    "/listings/cover-studio.jpg",
  );

  await openMenuAt(0);
  await user.click(screen.getByRole("menuitem", { name: "Удалить" }));
  await user.click(screen.getByRole("button", { name: "Да, удалить" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(table).getAllByRole("row")).toHaveLength(8);

  await user.click(screen.getByRole("tab", { name: "На модерации" }));
  const moderationTable = screen.getByRole("table", { name: "На модерации" });
  expect(within(moderationTable).getAllByRole("row")).toHaveLength(2);
});

test("unpublish moves row to archive and keeps it on all tab", async () => {
  const user = userEvent.setup();
  renderPage();

  const allTable = screen.getByRole("table", { name: "Все объявления" });
  const unpublishedBefore = within(allTable).getAllByText(
    "Снято с публикации",
  ).length;
  const publishedTitle = "Частный дом в 10 км от Москвы";

  await openMenuAt(1);
  await user.click(
    screen.getByRole("menuitem", { name: "Снять с публикации" }),
  );

  const dialog = await screen.findByRole("dialog", {
    name: "Снять объявление с публикации?",
  });
  expect(dialog.textContent).toMatch(/Объявление /);
  expect(dialog.textContent).not.toMatch(/Обявление /);

  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(allTable).getAllByRole("row")).toHaveLength(9);
  expect(within(allTable).getAllByText("Снято с публикации")).toHaveLength(
    unpublishedBefore,
  );

  await openMenuAt(1);
  await user.click(
    screen.getByRole("menuitem", { name: "Снять с публикации" }),
  );
  await user.click(screen.getByRole("button", { name: "Да, снять" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(allTable).getAllByRole("row")).toHaveLength(9);
  expect(within(allTable).getAllByText("Снято с публикации")).toHaveLength(
    unpublishedBefore + 1,
  );

  await user.click(screen.getByRole("tab", { name: "Архив" }));
  const archiveTable = screen.getByRole("table", { name: "Архив" });
  expect(
    within(archiveTable).getAllByText("Снято с публикации").length,
  ).toBeGreaterThanOrEqual(unpublishedBefore + 1);
  expect(
    within(archiveTable).getAllByText(publishedTitle).length,
  ).toBeGreaterThanOrEqual(1);

  await user.click(screen.getByRole("tab", { name: "Опубликованы" }));
  const publishedTable = screen.getByRole("table", { name: "Опубликованы" });
  expect(within(publishedTable).getAllByRole("row")).toHaveLength(4);
  expect(
    within(publishedTable).queryByText("Снято с публикации"),
  ).not.toBeInTheDocument();
});

test("publish moves row from archive to published and keeps it on all", async () => {
  const user = userEvent.setup();
  renderPage();

  const allTable = screen.getByRole("table", { name: "Все объявления" });
  const unpublishedBefore = within(allTable).getAllByText(
    "Снято с публикации",
  ).length;
  const publishedBefore = within(allTable).getAllByText("Опубликовано").length;
  const title = "Квартира в старом городе";

  await openMenuAt(2);
  await user.click(screen.getByRole("menuitem", { name: "Опубликовать" }));

  const dialog = await screen.findByRole("dialog", {
    name: "Опубликовать объявление?",
  });
  expect(dialog).toHaveClass("w-[438px]");
  expect(dialog.textContent).toMatch(/Объявление будет отображаться/);
  const confirmBtn = screen.getByRole("button", { name: "Да, опубликовать" });
  expect(confirmBtn).toHaveClass("whitespace-nowrap");

  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(allTable).getAllByText("Снято с публикации")).toHaveLength(
    unpublishedBefore,
  );

  await openMenuAt(2);
  await user.click(screen.getByRole("menuitem", { name: "Опубликовать" }));
  await user.click(screen.getByRole("button", { name: "Да, опубликовать" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(allTable).getAllByRole("row")).toHaveLength(9);
  expect(within(allTable).getAllByText("Снято с публикации")).toHaveLength(
    unpublishedBefore - 1,
  );
  expect(within(allTable).getAllByText("Опубликовано")).toHaveLength(
    publishedBefore + 1,
  );

  await user.click(screen.getByRole("tab", { name: "Архив" }));
  const archiveTable = screen.getByRole("table", { name: "Архив" });
  expect(within(archiveTable).getAllByRole("row")).toHaveLength(2);
  expect(within(archiveTable).queryByText(title)).not.toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Опубликованы" }));
  const publishedTable = screen.getByRole("table", { name: "Опубликованы" });
  expect(within(publishedTable).getByText(title)).toBeInTheDocument();
  expect(
    within(publishedTable).getAllByText("Опубликовано").length,
  ).toBeGreaterThanOrEqual(5);
});

test("edit from archive tab navigates to edit flow", async () => {
  const user = userEvent.setup();
  renderPage();

  await user.click(screen.getByRole("tab", { name: "Архив" }));
  const buttons = screen.getAllByRole("button", { name: /Действия для/ });
  await user.click(buttons[0]!);
  await user.click(screen.getByRole("menuitem", { name: "Редактировать" }));
  expect(screen.getByTestId("edit-flow")).toBeInTheDocument();
});

test("row click on each tab opens listing preview", async () => {
  const user = userEvent.setup();
  renderPage();

  const allTable = screen.getByRole("table", { name: "Все объявления" });
  const moderationRows = within(allTable).getAllByRole("row", {
    name: /Открыть объявление Уютная студия в центре Москвы/,
  });
  await user.click(moderationRows[0]!);
  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  expect(screen.getByText("На модерации")).toBeInTheDocument();
  expect(screen.getByTestId("listing-preview-extra-photos")).toHaveTextContent(
    "+6 фото",
  );

  await user.click(screen.getByRole("button", { name: "Назад" }));
  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Опубликованы" }));
  const publishedTable = screen.getByRole("table", { name: "Опубликованы" });
  await user.click(
    within(publishedTable).getByRole("row", {
      name: /Открыть объявление Апартаменты для семьи/,
    }),
  );
  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  expect(screen.getByText("Опубликовано")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Перейти в календарь бронирования" }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Назад" }));
  await user.click(screen.getByRole("tab", { name: "На модерации" }));
  const moderationTable = screen.getByRole("table", { name: "На модерации" });
  await user.click(
    within(moderationTable).getByRole("row", {
      name: /Открыть объявление Уютная студия в центре Москвы/,
    }),
  );
  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  expect(screen.getByText("На модерации")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Редактировать" })).toBeNull();

  await user.click(screen.getByRole("button", { name: "Назад" }));
  await user.click(screen.getByRole("tab", { name: "Архив" }));
  const archiveTable = screen.getByRole("table", { name: "Архив" });
  await user.click(
    within(archiveTable).getByRole("row", {
      name: /Открыть объявление Квартира в старом городе/,
    }),
  );
  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  expect(screen.getByText("Снято с публикации")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Опубликовать" })).toBeInTheDocument();
});
