import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SESSION_KEY, LISTINGS_KEY, USERS_KEY } from "../api/keys";
import type { Listing, Session } from "../api/types";
import { SessionProvider } from "../app/session";
import {
  ALL_LISTINGS_STORAGE_KEY,
  AllListingsProvider,
} from "../features/listings";
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

test("forbidden-guests draft submits to moderation", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing(
    completeListing({
      title: "Черновик без гостей",
      guestsForbidden: true,
      maxGuests: 0,
    }),
  );
  renderPreview();

  await screen.findByRole("heading", { name: "Черновик без гостей" });
  await user.click(
    screen.getByRole("button", { name: "Отправить на модерацию" }),
  );

  expect(screen.queryByTestId("edit-page")).not.toBeInTheDocument();
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
  expect(within(modTable).getByText("Черновик без гостей")).toBeInTheDocument();
  const stored = JSON.parse(
    localStorage.getItem(LISTINGS_KEY) ?? "[]",
  ) as Listing[];
  expect(stored.find((item) => item.title === "Черновик без гостей")?.status).toBe(
    "moderation",
  );
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

test("published preview shows badge and header actions", async () => {
  seedSession();
  seedListing(
    completeListing({
      status: "published",
      title: "Опубликованная студия",
      photos: Array.from({ length: 10 }, (_, i) => `data:image/png;base64,${i}`),
    }),
  );
  renderPreview();

  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  expect(screen.getByText("Опубликовано")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Редактировать" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Удалить" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Снять с публикации" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Перейти в календарь бронирования" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Опубликовать" })).toBeNull();
  expect(screen.getByTestId("listing-preview-extra-photos")).toHaveTextContent(
    "+6 фото",
  );
});

test("calendar button opens booking alert and Escape closes it", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing(
    completeListing({
      status: "published",
      title: "Опубликованная студия",
    }),
  );
  renderPreview();

  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

  await user.click(
    screen.getByRole("button", { name: "Перейти в календарь бронирования" }),
  );

  const dialog = await screen.findByRole("alertdialog");
  expect(dialog).toHaveAccessibleName("Календарь бронирования");

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("moderation preview shows only delete action", async () => {
  seedSession();
  seedListing(
    completeListing({
      status: "moderation",
      title: "На проверке",
    }),
  );
  renderPreview();

  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  expect(screen.getByText("На модерации")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Удалить" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Редактировать" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Снять с публикации" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Перейти в календарь бронирования" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Опубликовать" })).toBeNull();
});

test("unpublished preview shows edit delete and publish", async () => {
  seedSession();
  seedListing(
    completeListing({
      status: "archived",
      title: "Снятая студия",
    }),
  );
  renderPreview();

  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  expect(screen.getByText("Снято с публикации")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Редактировать" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Удалить" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Опубликовать" })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Снять с публикации" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Перейти в календарь бронирования" }),
  ).toBeNull();
});

function seedAllListingsRow(
  row: {
    id: string;
    title: string;
    address: string;
    housingType: Listing["housingType"];
    status: "published" | "moderation" | "unpublished" | "draft";
    coverUrl?: string;
  },
): void {
  localStorage.setItem(ALL_LISTINGS_STORAGE_KEY, JSON.stringify([row]));
}

test.each([
  {
    status: "published" as const,
    title: "Частный дом в 10 км от Москвы",
    address: "Лесной, ул. Летняя 3",
    housingType: "house" as const,
    badge: "Опубликовано",
    expectedActions: [
      "Редактировать",
      "Удалить",
      "Снять с публикации",
      "Перейти в календарь бронирования",
    ],
    unexpectedActions: ["Опубликовать"],
  },
  {
    status: "moderation" as const,
    title: "Уютная студия в центре Москвы",
    address: "Москва, ул. Невская 48",
    housingType: "apartment" as const,
    badge: "На модерации",
    expectedActions: ["Удалить"],
    unexpectedActions: [
      "Редактировать",
      "Снять с публикации",
      "Опубликовать",
      "Перейти в календарь бронирования",
    ],
  },
  {
    status: "unpublished" as const,
    title: "Квартира в старом городе",
    address: "Москва, ул. Невская 48",
    housingType: "apartment" as const,
    badge: "Снято с публикации",
    expectedActions: ["Редактировать", "Удалить", "Опубликовать"],
    unexpectedActions: [
      "Снять с публикации",
      "Перейти в календарь бронирования",
    ],
  },
])(
  "preview matches AllListingsStore row for $status despite divergent API",
  async ({
    status,
    title,
    address,
    housingType,
    badge,
    expectedActions,
    unexpectedActions,
  }) => {
    seedSession();
    seedAllListingsRow({
      id: LISTING_ID,
      title,
      address,
      housingType,
      status,
      coverUrl: "/listings/cover-from-row.jpg",
    });
    seedListing(
      completeListing({
        status: "draft",
        title: "Чужой заголовок API",
        address: "Чужой адрес API",
        housingType: "studio",
        description: "test-api-only",
        amenityIds: ["wifi", "hairdryer"],
        photos: ["/api-only-photo.jpg"],
      }),
    );
    renderPreview();

    expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
    expect(screen.getByText(badge)).toBeInTheDocument();
    expect(screen.queryByText("test-api-only")).not.toBeInTheDocument();
    expect(screen.queryByText("Чужой заголовок API")).not.toBeInTheDocument();

    for (const name of expectedActions) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    for (const name of unexpectedActions) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
  },
);

test("back from draft preview goes to listings not wizard", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing(completeListing({ title: "Черновик для назад" }));

  render(
    <SessionProvider>
      <MemoryRouter
        initialEntries={[
          "/listings",
          `/listings/${LISTING_ID}/edit?step=6`,
          `/listings/${LISTING_ID}/preview`,
        ]}
        initialIndex={2}
      >
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

  expect(
    await screen.findByRole("heading", { name: "Создание объявления" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Назад" }));

  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(screen.queryByTestId("edit-page")).not.toBeInTheDocument();
  expect(screen.queryByText("Мастер редактирования")).not.toBeInTheDocument();
});

test("back from preview restores listings tab from location state", async () => {
  const user = userEvent.setup();
  seedSession();
  seedAllListingsRow({
    id: LISTING_ID,
    title: "Опубликованная студия",
    address: "Москва, ул. Садовая 10",
    housingType: "apartment",
    status: "published",
  });
  seedListing(
    completeListing({
      status: "published",
      title: "Опубликованная студия",
    }),
  );

  render(
    <SessionProvider>
      <MemoryRouter
        initialEntries={[
          {
            pathname: `/listings/${LISTING_ID}/preview`,
            state: { fromTab: "published" },
          },
        ]}
      >
        <AllListingsProvider>
          <Routes>
            <Route path="/listings" element={<ListingsPage />} />
            <Route
              path="/listings/:id/preview"
              element={<ListingPreviewPage />}
            />
          </Routes>
        </AllListingsProvider>
      </MemoryRouter>
    </SessionProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Объявление" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Назад" }));

  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Опубликованы" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
