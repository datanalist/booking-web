import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SESSION_KEY, USERS_KEY } from "../api/keys";
import type { Session } from "../api/types";
import { SessionProvider } from "../app/session";
import { AllListingsProvider } from "../features/listings";
import { ListingPreviewPage } from "./ListingPreviewPage";
import { ListingsPage } from "./ListingsPage";
import { ListingWizardPage } from "./ListingWizardPage";

const OWNER_ID = "owner-wizard-origin-1";

type TabName = "Все объявления" | "Опубликованы" | "На модерации" | "Архив";

beforeEach(() => {
  localStorage.clear();
  const session: Session = {
    userId: OWNER_ID,
    email: "origin@example.com",
    name: "Ирина",
    phone: "+79001112233",
    onboardingComplete: true,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(
    USERS_KEY,
    JSON.stringify([
      {
        id: OWNER_ID,
        email: session.email,
        passwordHash: "x",
        name: session.name,
        phone: session.phone,
        onboardingComplete: true,
      },
    ]),
  );
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderApp(): void {
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/listings"]}>
        <AllListingsProvider>
          <Routes>
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/listings/new" element={<ListingWizardPage />} />
            <Route path="/listings/:id/edit" element={<ListingWizardPage />} />
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

async function expectListingsOnTab(tab: TabName): Promise<void> {
  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: tab })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.queryByText("Создание объявления")).not.toBeInTheDocument();
}

async function clickWizardHeaderBack(): Promise<void> {
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Создание объявления" });
  await user.click(screen.getByRole("button", { name: "Назад" }));
}

const EDIT_CASES: ReadonlyArray<{
  tab: TabName;
  title: string;
}> = [
  { tab: "Все объявления", title: "Апартаменты для семьи" },
  { tab: "Опубликованы", title: "Апартаменты для семьи" },
  { tab: "Архив", title: "Квартира в старом городе" },
];

describe("стрелка «Назад» в шапке мастера ведёт в список на вкладку-источник", () => {
  test.each(EDIT_CASES)(
    "список ($tab) → меню «Редактировать» → Назад",
    async ({ tab, title }) => {
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByRole("tab", { name: tab }));
      const menuButton = screen.getAllByRole("button", {
        name: `Действия для «${title}»`,
      })[0];
      if (!menuButton) {
        throw new Error("menu button not found");
      }
      await user.click(menuButton);
      await user.click(screen.getByRole("menuitem", { name: "Редактировать" }));

      await clickWizardHeaderBack();
      await expectListingsOnTab(tab);
    },
  );

  test.each(EDIT_CASES.filter((item) => item.tab !== "Все объявления"))(
    "список ($tab) → предпросмотр → «Редактировать» → Назад",
    async ({ tab, title }) => {
      const user = userEvent.setup();
      renderApp();
      await user.click(screen.getByRole("tab", { name: tab }));
      const table = screen.getByRole("table", { name: tab });
      await user.click(
        within(table).getAllByRole("row", {
          name: new RegExp(`Открыть объявление ${title}`),
        })[0]!,
      );
      await user.click(
        await screen.findByRole("button", { name: "Редактировать" }),
      );

      await clickWizardHeaderBack();
      await expectListingsOnTab(tab);
    },
  );

  test.each<TabName>([
    "Все объявления",
    "Опубликованы",
    "На модерации",
    "Архив",
  ])("список (%s) → «Создать объявление» → Назад", async (tab) => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("tab", { name: tab }));
    await user.click(screen.getByRole("button", { name: "Создать объявление" }));

    await clickWizardHeaderBack();
    await expectListingsOnTab(tab);
  });

  test("вкладка сохраняется при переходе между шагами мастера", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("tab", { name: "Архив" }));
    const menuButton = screen.getAllByRole("button", {
      name: "Действия для «Квартира в старом городе»",
    })[0]!;
    await user.click(menuButton);
    await user.click(screen.getByRole("menuitem", { name: "Редактировать" }));
    await screen.findByRole("heading", { name: "Создание объявления" });

    const description = screen.getByLabelText(/Описание/);
    await user.clear(description);
    await user.type(description, "Подробное описание жилья для проверки шагов.");
    await user.click(screen.getByRole("button", { name: "Далее" }));
    expect(await screen.findByText("Добавьте фото жилья")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Назад" }));
    await expectListingsOnTab("Архив");
  });
});
