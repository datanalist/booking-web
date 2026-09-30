import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LISTINGS_KEY, SESSION_KEY, USERS_KEY } from "../api/keys";
import type { Listing, Session } from "../api/types";
import { SessionProvider } from "../app/session";
import {
  ALL_LISTINGS_STORAGE_KEY,
  AllListingsProvider,
} from "../features/listings";
import { ListingPreviewPage } from "./ListingPreviewPage";
import { ListingsPage } from "./ListingsPage";
import { ListingWizardPage } from "./ListingWizardPage";

const OWNER_ID = "owner-wizard-back-1";
const LISTING_ID = "wizard-back-listing-1";

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
    email: "wizard-back@example.com",
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

function completeListing(): Listing {
  const photos = Array.from(
    { length: 6 },
    (_, i) => `data:image/png;base64,wizard${i}`,
  );
  return {
    id: LISTING_ID,
    ownerId: OWNER_ID,
    status: "draft",
    title: "Черновик из мастера",
    address: "Москва, ул. Мастерская 1",
    housingType: "apartment",
    description: "Полное описание для выхода в предпросмотр из шага стоимости.",
    photos,
    amenityIds: ["wifi"],
    extraAmenityIds: [],
    maxGuests: 2,
    guestsForbidden: false,
    petsAllowed: false,
    cancellationAllowed: false,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    accessInfo: "Код 1111",
    houseRules: "Тишина",
    extraInfo: "",
    priceNight: 3000,
    priceFrom14: 2800,
    priceFrom28: 2500,
    uniquePrices: [],
    updatedAt: new Date().toISOString(),
  };
}

test("save in wizard then preview back returns to listings not cost step", async () => {
  const user = userEvent.setup();
  seedSession();
  const listing = completeListing();
  localStorage.setItem(LISTINGS_KEY, JSON.stringify([listing]));
  localStorage.setItem(
    ALL_LISTINGS_STORAGE_KEY,
    JSON.stringify([
      {
        id: listing.id,
        title: listing.title,
        address: listing.address,
        housingType: listing.housingType,
        status: "draft",
        coverUrl: listing.photos[0],
      },
    ]),
  );

  render(
    <SessionProvider>
      <MemoryRouter
        initialEntries={["/listings", `/listings/${LISTING_ID}/edit?step=6`]}
        initialIndex={1}
      >
        <AllListingsProvider>
          <Routes>
            <Route path="/listings" element={<ListingsPage />} />
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

  expect(
    await screen.findByText("Укажите стоимость жилья за сутки"),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Далее" }));

  expect(
    await screen.findByRole("heading", { name: "Создание объявления" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Черновик из мастера" }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Назад" }));

  expect(
    await screen.findByRole("heading", { name: "Мои объявления" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Укажите стоимость жилья за сутки"),
  ).not.toBeInTheDocument();
});
