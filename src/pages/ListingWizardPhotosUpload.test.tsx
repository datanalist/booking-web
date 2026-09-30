import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LISTINGS_KEY, SESSION_KEY, USERS_KEY } from "../api/keys";
import type { Listing, Session } from "../api/types";
import { SessionProvider } from "../app/session";
import {
  ALL_LISTINGS_STORAGE_KEY,
  AllListingsProvider,
} from "../features/listings";
import { ListingWizardPage } from "./ListingWizardPage";

const OWNER_ID = "owner-photo-upload-1";
const LISTING_ID = "photo-upload-listing-1";

vi.mock("../lib/compressImage", () => ({
  compressImage: vi.fn(async (file: File) => {
    if (file.name.startsWith("bad")) {
      throw new Error("compress failed");
    }
    return `data:image/jpeg;base64,${file.name}`;
  }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

beforeEach(() => {
  localStorage.clear();
});

function seedSession(): void {
  const session: Session = {
    userId: OWNER_ID,
    email: "photo-upload@example.com",
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

function seedDraft(photos: string[] = []): Listing {
  return {
    id: LISTING_ID,
    ownerId: OWNER_ID,
    status: "draft",
    title: "Студия у парка",
    address: "Москва, Парковая 1",
    housingType: "apartment",
    description: "Описание объявления для шага фото.",
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

function seedWizardStorage(listing: Listing): void {
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
      },
    ]),
  );
}

function renderWizardStep2(): void {
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={[`/listings/${LISTING_ID}/edit?step=2`]}>
        <AllListingsProvider>
          <Routes>
            <Route path="/listings/:id/edit" element={<ListingWizardPage />} />
          </Routes>
        </AllListingsProvider>
      </MemoryRouter>
    </SessionProvider>,
  );
}

function requireFileInput(): HTMLInputElement {
  const element = document.querySelector('input[type="file"]');
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("file input missing");
  }
  return element;
}

test("after successful photo upload Next is enabled and opens amenities step", async () => {
  const user = userEvent.setup();
  seedSession();
  seedWizardStorage(seedDraft());

  renderWizardStep2();

  expect(await screen.findByText("Добавьте фото жилья")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Далее" })).toBeDisabled();

  const input = requireFileInput();
  const files = Array.from(
    { length: 6 },
    (_, i) => new File([`p${i}`], `photo-${i}.jpg`, { type: "image/jpeg" }),
  );
  await user.upload(input, files);

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Далее" })).toBeEnabled();
  });
  expect(screen.queryByRole("status")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Далее" }));

  expect(
    await screen.findByText(
      "Укажите удобства и дополнительные характеристики жилья",
    ),
  ).toBeInTheDocument();
});

test("one failed file does not block others and Next stays available with enough photos", async () => {
  const user = userEvent.setup();
  seedSession();
  seedWizardStorage(seedDraft());

  renderWizardStep2();
  expect(await screen.findByText("Добавьте фото жилья")).toBeInTheDocument();

  const input = requireFileInput();
  const files = [
    ...Array.from(
      { length: 6 },
      (_, i) => new File([`p${i}`], `photo-${i}.jpg`, { type: "image/jpeg" }),
    ),
    new File(["x"], "bad.jpg", { type: "image/jpeg" }),
  ];
  await user.upload(input, files);

  await waitFor(() => {
    expect(
      screen.getByText(/Не удалось обработать 1 из 7 фото/),
    ).toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Далее" })).toBeEnabled();
});

test("loading indicator appears during compress and clears after", async () => {
  const user = userEvent.setup();
  seedSession();
  seedWizardStorage(seedDraft());

  const { compressImage } = await import("../lib/compressImage");
  let releaseCompress!: () => void;
  const compressGate = new Promise<void>((resolve) => {
    releaseCompress = resolve;
  });
  vi.mocked(compressImage).mockImplementation(async (file: File) => {
    await compressGate;
    return `data:image/jpeg;base64,${file.name}`;
  });

  renderWizardStep2();
  expect(await screen.findByText("Добавьте фото жилья")).toBeInTheDocument();

  const input = requireFileInput();
  const uploadPromise = user.upload(input, [
    new File(["a"], "a.jpg", { type: "image/jpeg" }),
    new File(["b"], "b.jpg", { type: "image/jpeg" }),
    new File(["c"], "c.jpg", { type: "image/jpeg" }),
    new File(["d"], "d.jpg", { type: "image/jpeg" }),
    new File(["e"], "e.jpg", { type: "image/jpeg" }),
    new File(["f"], "f.jpg", { type: "image/jpeg" }),
  ]);

  expect(await screen.findByRole("status")).toHaveTextContent("Обработка фото…");
  expect(screen.getByRole("button", { name: "Далее" })).toBeDisabled();

  releaseCompress();
  await uploadPromise;

  await waitFor(() => {
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Далее" })).toBeEnabled();
});
