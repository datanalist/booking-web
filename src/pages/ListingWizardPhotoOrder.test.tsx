import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LISTINGS_KEY, SESSION_KEY, USERS_KEY } from "../api/keys";
import type { Listing, Session } from "../api/types";
import { SessionProvider } from "../app/session";
import {
  ALL_LISTINGS_STORAGE_KEY,
  AllListingsProvider,
  type ListingTableRow,
} from "../features/listings";
import { WIZARD_PHOTO_DRAG_MIME } from "../lib/wizardPhotoDragMime";
import { ListingPreviewPage } from "./ListingPreviewPage";
import { ListingWizardPage } from "./ListingWizardPage";

const OWNER_ID = "owner-photo-order-1";
const LISTING_ID = "photo-order-listing-1";

const PHOTOS: readonly string[] = Array.from(
  { length: 8 },
  (_, i) => `/data/order-${i}.jpg`,
);

beforeEach(() => {
  localStorage.clear();
  const session: Session = {
    userId: OWNER_ID,
    email: "order@example.com",
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

function seedListing(status: Listing["status"]): void {
  const listing: Listing = {
    id: LISTING_ID,
    ownerId: OWNER_ID,
    status,
    title: "Порядок фото",
    address: "Москва, ул. Мастерская 1",
    housingType: "apartment",
    description: "Полное описание для проверки порядка фото.",
    photos: [...PHOTOS],
    amenityIds: ["wifi"],
    extraAmenityIds: [],
    maxGuests: 2,
    guestsForbidden: false,
    petsAllowed: false,
    cancellationAllowed: false,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    accessInfo: "Код",
    houseRules: "Тишина",
    extraInfo: "",
    priceNight: 3000,
    priceFrom14: 2800,
    priceFrom28: 2500,
    uniquePrices: [],
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LISTINGS_KEY, JSON.stringify([listing]));
}

function seedTableRow(status: ListingTableRow["status"]): void {
  const row: ListingTableRow = {
    id: LISTING_ID,
    title: "Порядок фото",
    address: "Москва, ул. Мастерская 1",
    housingType: "apartment",
    status,
    coverUrl: PHOTOS[0],
  };
  localStorage.setItem(ALL_LISTINGS_STORAGE_KEY, JSON.stringify([row]));
}

function renderAt(path: string): void {
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={[path]}>
        <AllListingsProvider>
          <Routes>
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

function dragPhoto(container: HTMLElement, from: number, to: number): void {
  const slots = container.querySelectorAll("[draggable='true']");
  const source = slots[from];
  const target = slots[to];
  if (!source || !target) {
    throw new Error("photo slots not found");
  }
  fireEvent.dragStart(source, {
    dataTransfer: {
      setData: () => undefined,
      effectAllowed: "move",
      types: [WIZARD_PHOTO_DRAG_MIME],
    },
  });
  fireEvent.drop(target, {
    dataTransfer: {
      types: [WIZARD_PHOTO_DRAG_MIME],
      getData: () => "",
      files: [] as unknown as FileList,
    },
  });
}

/** Порядок фото галереи предпросмотра: главное, миниатюры, подложка «+N фото». */
function galleryOrder(): string[] {
  const thumbs = screen.getByTestId("listing-preview-thumbs");
  const hero = thumbs.previousElementSibling?.querySelector("img");
  const heroSrc = hero?.getAttribute("src");
  if (!heroSrc) {
    throw new Error("hero image not found");
  }
  const thumbSrcs = [...thumbs.querySelectorAll("img")].map(
    (img) => img.getAttribute("src") ?? "",
  );
  return [heroSrc, ...thumbSrcs];
}

function storedPhotos(): string[] {
  const raw = localStorage.getItem(LISTINGS_KEY);
  const list: Listing[] = raw ? (JSON.parse(raw) as Listing[]) : [];
  return list.find((item) => item.id === LISTING_ID)?.photos ?? [];
}

const REORDERED: readonly string[] = [
  PHOTOS[3]!,
  PHOTOS[0]!,
  PHOTOS[1]!,
  PHOTOS[2]!,
  PHOTOS[4]!,
  PHOTOS[5]!,
  PHOTOS[6]!,
  PHOTOS[7]!,
];

const STATUS_CASES: ReadonlyArray<{
  api: Listing["status"];
  table: ListingTableRow["status"];
}> = [
  { api: "draft", table: "draft" },
  { api: "moderation", table: "moderation" },
  { api: "draft", table: "unpublished" },
  { api: "moderation", table: "published" },
];

describe("порядок фото: мастер → предпросмотр", () => {
  test.each(STATUS_CASES)(
    "после перестановки предпросмотр показывает весь порядок (API $api, таблица $table)",
    async ({ api, table }) => {
      const user = userEvent.setup();
      seedListing(api);
      seedTableRow(table);
      renderAt(`/listings/${LISTING_ID}/edit?step=2`);

      await screen.findByText("Добавьте фото жилья");
      dragPhoto(document.body, 3, 0);
      await user.click(screen.getByRole("button", { name: "Далее" }));
      await screen.findByText(/Укажите удобства/);

      expect(storedPhotos()).toEqual(REORDERED);
      cleanup();

      // Новый рендер = перезагрузка страницы: порядок берётся из хранилища.
      renderAt(`/listings/${LISTING_ID}/preview`);
      await screen.findByTestId("listing-preview-thumbs");
      const order = galleryOrder();
      expect(order.slice(0, 4)).toEqual(REORDERED.slice(0, 4));
      expect(order[4]).toBe(REORDERED[4]);
    },
  );
});

describe("порядок фото: смена статуса в списке не подмешивает демо-фото", () => {
  test.each(STATUS_CASES)(
    "предпросмотр при расхождении статусов (API $api, таблица $table) берёт фото из объявления",
    async ({ api, table }) => {
      seedListing(api);
      seedTableRow(table);
      const raw = localStorage.getItem(LISTINGS_KEY);
      const stored: Listing[] = raw ? (JSON.parse(raw) as Listing[]) : [];
      localStorage.setItem(
        LISTINGS_KEY,
        JSON.stringify(
          stored.map((item) => ({ ...item, photos: [...REORDERED] })),
        ),
      );
      localStorage.setItem(
        ALL_LISTINGS_STORAGE_KEY,
        JSON.stringify([
          {
            id: LISTING_ID,
            title: "Порядок фото",
            address: "Москва, ул. Мастерская 1",
            housingType: "apartment",
            status: table,
            coverUrl: REORDERED[0],
          },
        ]),
      );

      renderAt(`/listings/${LISTING_ID}/preview`);
      await screen.findByTestId("listing-preview-thumbs");
      expect(galleryOrder().slice(0, 5)).toEqual(REORDERED.slice(0, 5));
    },
  );
});
