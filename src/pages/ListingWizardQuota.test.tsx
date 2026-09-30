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
  MOCK_ALL_LISTINGS,
} from "../features/listings";
import { ListingWizardPage } from "./ListingWizardPage";

const OWNER_ID = "owner-quota-wizard-1";
const LISTING_ID = "mock-2";

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
    email: "quota-wizard@example.com",
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

function seedEditableListing(): Listing {
  const photos = Array.from(
    { length: 6 },
    (_, i) => `data:image/jpeg;base64,${"P".repeat(50_000)}${i}`,
  );
  return {
    id: LISTING_ID,
    ownerId: OWNER_ID,
    status: "draft",
    title: "Частный дом в 10 км от Москвы",
    address: "Лесной, ул. Летняя 3",
    housingType: "house",
    description: "Описание для перехода со шага 1 на шаг 2 без ошибки квоты.",
    photos,
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
    updatedAt: new Date().toISOString(),
  };
}

test("published edit step 1 Next opens step 2 without quota crash", async () => {
  const user = userEvent.setup();
  seedSession();

  const bloatedCover = `data:image/jpeg;base64,${"X".repeat(80_000)}`;
  const tableRows = MOCK_ALL_LISTINGS.map((row) => ({
    ...row,
    coverUrl: bloatedCover,
  }));
  localStorage.setItem(ALL_LISTINGS_STORAGE_KEY, JSON.stringify(tableRows));
  localStorage.setItem(LISTINGS_KEY, JSON.stringify([seedEditableListing()]));

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

  expect(
    await screen.findByDisplayValue("Частный дом в 10 км от Москвы"),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Далее" }));

  expect(
    await screen.findByText("Добавьте фото жилья"),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Unexpected Application Error!"),
  ).not.toBeInTheDocument();

  const stored = localStorage.getItem(ALL_LISTINGS_STORAGE_KEY);
  expect(stored).not.toBeNull();
  expect(stored).not.toContain("data:");
});
