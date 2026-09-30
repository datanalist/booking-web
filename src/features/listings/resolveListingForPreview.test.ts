import { expect, test } from "vitest";
import type { Listing } from "../../api/types";
import type { ListingTableRow } from "./ListingTableRow";
import { resolveListingForPreview } from "./resolveListingForPreview";

const OWNER = "owner-1";

function tableRow(
  overrides: Partial<ListingTableRow> = {},
): ListingTableRow {
  return {
    id: "mock-2",
    title: "Частный дом в 10 км от Москвы",
    address: "Лесной, ул. Летняя 3",
    housingType: "house",
    status: "published",
    coverUrl: "/listings/cover-house.jpg",
    ...overrides,
  };
}

function apiListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "mock-2",
    ownerId: OWNER,
    status: "moderation",
    title: "Чужой заголовок API",
    address: "Чужой адрес",
    housingType: "apartment",
    description: "test",
    photos: ["/api-photo.jpg"],
    amenityIds: ["wifi", "hairdryer"],
    extraAmenityIds: [],
    maxGuests: 2,
    guestsForbidden: false,
    petsAllowed: false,
    cancellationAllowed: false,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    accessInfo: "",
    houseRules: "",
    extraInfo: "",
    priceNight: 1000,
    priceFrom14: 900,
    priceFrom28: 800,
    uniquePrices: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("store row wins status title address type over divergent API listing", () => {
  const row = tableRow({ status: "published" });
  const resolved = resolveListingForPreview(row, apiListing(), OWNER);

  expect(resolved).not.toBeNull();
  expect(resolved?.status).toBe("published");
  expect(resolved?.title).toBe(row.title);
  expect(resolved?.address).toBe(row.address);
  expect(resolved?.housingType).toBe("house");
  expect(resolved?.photos[0]).toBe(row.coverUrl);
  expect(resolved?.description).not.toBe("test");
});

test("unpublished store row ignores moderation API details", () => {
  const row = tableRow({
    id: "mock-3",
    title: "Квартира в старом городе",
    address: "Москва, ул. Невская 48",
    housingType: "apartment",
    status: "unpublished",
    coverUrl: "/listings/cover-apartment.jpg",
  });
  const resolved = resolveListingForPreview(
    row,
    apiListing({
      id: "mock-3",
      status: "moderation",
      title: "Квартира в старом городе",
      description: "Крутая",
      amenityIds: ["wifi", "tv", "hairdryer"],
    }),
    OWNER,
  );

  expect(resolved?.status).toBe("archived");
  expect(resolved?.title).toBe(row.title);
  expect(resolved?.address).toBe(row.address);
  expect(resolved?.description).not.toBe("Крутая");
  expect(resolved?.photos[0]).toBe(row.coverUrl);
});

test("aligned API listing supplies own detail fields", () => {
  const row = tableRow({ status: "moderation" });
  const api = apiListing({
    status: "moderation",
    title: "Другое",
    description: "Своё описание",
    amenityIds: ["wifi", "tv"],
  });
  const resolved = resolveListingForPreview(row, api, OWNER);

  expect(resolved?.status).toBe("moderation");
  expect(resolved?.title).toBe(row.title);
  expect(resolved?.description).toBe("Своё описание");
  expect(resolved?.amenityIds).toEqual(["wifi", "tv"]);
  expect(resolved?.photos[0]).toBe(row.coverUrl);
});

test("without table row returns API listing as-is", () => {
  const api = apiListing({ id: "only-api" });
  expect(resolveListingForPreview(undefined, api, OWNER)).toEqual(api);
});

test("without table row and API returns null", () => {
  expect(resolveListingForPreview(undefined, null, OWNER)).toBeNull();
});
