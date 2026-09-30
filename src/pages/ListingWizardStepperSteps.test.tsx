import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LISTINGS_KEY, SESSION_KEY, USERS_KEY } from "../api/keys";
import type { Listing, Session } from "../api/types";
import { SessionProvider } from "../app/session";
import { AllListingsProvider } from "../features/listings";
import { ListingWizardPage } from "./ListingWizardPage";

const OWNER_ID = "owner-stepper-1";
const LISTING_ID = "stepper-listing-1";

beforeEach(() => {
  localStorage.clear();
  const session: Session = {
    userId: OWNER_ID,
    email: "stepper@example.com",
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
  const listing: Listing = {
    id: LISTING_ID,
    ownerId: OWNER_ID,
    status: "draft",
    title: "Черновик",
    address: "Москва, ул. Мастерская 1",
    housingType: "apartment",
    description: "Полное описание для проверки степпера мастера.",
    photos: Array.from({ length: 6 }, (_, i) => `/data/stepper-${i}.jpg`),
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
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test.each([1, 2, 3, 4, 5, 6])(
  "на шаге %i мастера линия степпера идёт от первого шага до текущего",
  async (step) => {
    render(
      <SessionProvider>
        <MemoryRouter initialEntries={[`/listings/${LISTING_ID}/edit?step=${step}`]}>
          <AllListingsProvider>
            <Routes>
              <Route path="/listings/:id/edit" element={<ListingWizardPage />} />
            </Routes>
          </AllListingsProvider>
        </MemoryRouter>
      </SessionProvider>,
    );

    const line = await screen.findByTestId("wizard-steps-progress");
    expect(line.style.width).toBe(`${(step / 6) * 100}%`);
    expect(screen.getAllByTestId("wizard-steps-progress")).toHaveLength(1);
    const current = screen
      .getAllByRole("listitem")
      .filter((item) => item.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(new RegExp(`^${step}\\. `));
  },
);
