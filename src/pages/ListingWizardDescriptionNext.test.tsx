import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LISTINGS_KEY, SESSION_KEY, USERS_KEY } from "../api/keys";
import type { Listing, ListingStatus, Session } from "../api/types";
import { SessionProvider } from "../app/session";
import { AllListingsProvider } from "../features/listings";
import { ListingWizardPage } from "./ListingWizardPage";

const OWNER_ID = "owner-description-next-1";
const LISTING_ID = "published-description-1";

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
    email: "description-next@example.com",
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

function seedListing(status: ListingStatus): Listing {
  const listing: Listing = {
    id: LISTING_ID,
    ownerId: OWNER_ID,
    status,
    title: "Дом у леса",
    address: "Лесной, ул. Летняя 3",
    housingType: "house",
    description: "Описание жилья для перехода с шага сведений на шаг фото.",
    photos: [],
    amenityIds: [],
    extraAmenityIds: [],
    maxGuests: 0,
    guestsForbidden: false,
    petsAllowed: false,
    cancellationAllowed: false,
    checkInTime: "",
    checkOutTime: "",
    accessInfo: "",
    houseRules: "",
    extraInfo: "",
    priceNight: 0,
    priceFrom14: 0,
    priceFrom28: 0,
    uniquePrices: [],
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
  localStorage.setItem(LISTINGS_KEY, JSON.stringify([listing]));
  return listing;
}

function renderDescriptionStep(): void {
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={[`/listings/${LISTING_ID}/edit?step=1`]}>
        <AllListingsProvider>
          <Routes>
            <Route path="/listings/:id/edit" element={<ListingWizardPage />} />
          </Routes>
        </AllListingsProvider>
      </MemoryRouter>
    </SessionProvider>,
  );
}

test("у опубликованного объявления «Далее» на шаге описания открывает шаг фото", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing("published");
  const storedBefore = localStorage.getItem(LISTINGS_KEY);

  renderDescriptionStep();

  expect(await screen.findByDisplayValue("Дом у леса")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Далее" }));

  expect(await screen.findByText("Добавьте фото жилья")).toBeInTheDocument();
  expect(localStorage.getItem(LISTINGS_KEY)).toBe(storedBefore);
});

test("у черновика «Далее» на шаге описания по-прежнему сохраняет и открывает шаг фото", async () => {
  const user = userEvent.setup();
  seedSession();
  seedListing("draft");

  renderDescriptionStep();

  expect(await screen.findByDisplayValue("Дом у леса")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Далее" }));

  expect(await screen.findByText("Добавьте фото жилья")).toBeInTheDocument();
  const stored = localStorage.getItem(LISTINGS_KEY);
  const listings: Listing[] = stored ? (JSON.parse(stored) as Listing[]) : [];
  expect(listings[0]?.status).toBe("draft");
  expect(listings[0]?.updatedAt).not.toBe("2026-10-01T00:00:00.000Z");
});
