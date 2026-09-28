import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SESSION_KEY, LISTINGS_KEY, USERS_KEY } from "../api/keys";
import type { Listing, Session } from "../api/types";
import { SessionProvider } from "../app/session";
import { AllListingsProvider } from "../features/listings";
import { ListingPreviewPage } from "./ListingPreviewPage";
import { ListingsPage } from "./ListingsPage";

const OWNER_ID = "owner-preview-1";
const LISTING_ID = "preview-listing-1";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

function seedSession(): void {
  const session: Session = {
    userId: OWNER_ID,
    email: "owner@example.com",
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
}

function completeListing(overrides: Partial<Listing> = {}): Listing {
  const photos = Array.from({ length: 6 }, (_, i) => `data:image/png;base64,${i}`);
  return {
    id: LISTING_ID,
    ownerId: OWNER_ID,
    status: "draft",
    title: "Черновик студии у парка",
    address: "Москва, ул. Садовая 10",
    housingType: "apartment",
    description: "Описание из мастера создания объявления для предпросмотра.",
    photos,
    amenityIds: ["wifi", "tv"],
    extraAmenityIds: ["parking"],
    maxGuests: 3,
    guestsForbidden: false,
    petsAllowed: true,
    cancellationAllowed: false,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    accessInfo: "Код домофона 1111\nЭтаж 2",
    houseRules: "Тишина после 22:00\nНе курить",
    extraInfo: "",
    priceNight: 2800,
    priceFrom14: 2500,
    priceFrom28: 2200,
    uniquePrices: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function seedListing(listing: Listing): void {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify([listing]));
}

function renderPreview(initialPath = `/listings/${LISTING_ID}/preview`) {
  return render(
    <SessionProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <AllListingsProvider>
          <Routes>
            <Route path="/listings" element={<ListingsPage />} />
            <Route
              path="/listings/:id/edit"
              element={<div data-testid="edit-page">Мастер редактирования</div>}
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

test("preview renders draft fields from listings store", async () => {
  seedSession();
  seedListing(completeListing());
  renderPreview();

  expect(
    await screen.findByRole("heading", { name: "Создание объявления" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Черновик студии у парка" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Москва, ул. Садовая 10")).toBeInTheDocument();
  expect(screen.getByText(/Описание из мастера/)).toBeInTheDocument();
  expect(screen.getByText("Wifi")).toBeInTheDocument();
  expect(screen.getByText("3 человека")).toBeInTheDocument();
  expect(screen.getByText("Код домофона 1111")).toBeInTheDocument();
});

test("preview shows guests forbidden instead of demo count", async () => {
  seedSession();
  seedListing(completeListing({ guestsForbidden: true, maxGuests: 0 }));
  renderPreview();

  expect(await screen.findByText("Запрещено")).toBeInTheDocument();
  expect(screen.queryByText("4 человека")).not.toBeInTheDocument();
});

test("save to archive opens archive tab with draft status and no publish", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing(completeListing({ title: "Архивный черновик XYZ" }));
  renderPreview();

  await screen.findByRole("heading", { name: "Создание объявления" });
  await user.click(screen.getByRole("button", { name: "Сохранить в архив" }));

  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Архив" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const archiveTable = screen.getByRole("table", { name: "Архив" });
  expect(within(archiveTable).getByText("Архивный черновик XYZ")).toBeInTheDocument();
  expect(
    within(archiveTable).getByRole("img", { name: "Архивный черновик XYZ" }),
  ).toHaveAttribute("src", "data:image/png;base64,0");
  const draftTitle = within(archiveTable).getByText("Архивный черновик XYZ");
  const draftRow = draftTitle.closest("[role='row']");
  expect(draftRow).not.toBeNull();
  expect(within(draftRow as HTMLElement).getByText("Черновик")).toBeInTheDocument();

  await user.click(
    within(draftRow as HTMLElement).getByRole("button", { name: /Действия для/ }),
  );
  const menu = screen.getByRole("menu", { name: "Действия с объявлением" });
  expect(within(menu).getByRole("menuitem", { name: "Редактировать" })).toBeInTheDocument();
  expect(within(menu).queryByRole("menuitem", { name: "Опубликовать" })).toBeNull();
});

test("delete removes listing and navigates to list", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing(completeListing({ title: "Удаляемый черновик" }));
  renderPreview();

  await screen.findByRole("heading", { name: "Удаляемый черновик" });
  await user.click(screen.getByRole("button", { name: "Удалить" }));
  await user.click(screen.getByRole("button", { name: "Да, удалить" }));

  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Удаляемый черновик")).not.toBeInTheDocument();
});

test("edit navigates to wizard without wiping draft title", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing(completeListing({ title: "Редактируемый черновик" }));
  renderPreview();

  await screen.findByRole("heading", { name: "Редактируемый черновик" });
  await user.click(screen.getByRole("button", { name: "Редактировать" }));

  expect(await screen.findByTestId("edit-page")).toBeInTheDocument();
  const stored = JSON.parse(
    localStorage.getItem(LISTINGS_KEY) ?? "[]",
  ) as Listing[];
  expect(stored[0]?.title).toBe("Редактируемый черновик");
});

test("submit for moderation shows alert then lands on moderation tab", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing(completeListing({ title: "На модерацию ASAP" }));
  renderPreview();

  await screen.findByRole("heading", { name: "На модерацию ASAP" });
  await user.click(
    screen.getByRole("button", { name: "Отправить на модерацию" }),
  );

  expect(
    await screen.findByRole("heading", {
      name: "Объявление отправлено на модерацию",
    }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Ок" }));

  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "На модерации" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const modTable = screen.getByRole("table", { name: "На модерации" });
  expect(within(modTable).getByText("На модерацию ASAP")).toBeInTheDocument();
  expect(within(modTable).getAllByText("На модерации").length).toBeGreaterThanOrEqual(
    1,
  );
});
