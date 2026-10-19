import { describe, expect, test } from "vitest";
import { parseIsoDate, type IsoDate } from "../../lib/isoDate";
import { emptyDraft } from "../../lib/emptyDraft";
import type { ListingDraft } from "../types";
import {
  PUBLIC_POCKETBASE_URL,
  amenityIdsFromPb,
  amenityIdsToPb,
  buildPbFileUrl,
  extraAmenityIdsFromPb,
  extraAmenityIdsToPb,
  extractCityFromAddress,
  housingTypeFromPb,
  housingTypeToPb,
  listingStatusFromPb,
  listingStatusToPb,
  listingWritableStatusToPb,
  pbListingToSiteListing,
  pbListingToTableRow,
  siteListingToPbPayload,
  tableRowToPbPatch,
  type PbListingRecord,
  type PbListingStatus,
} from "./index";

const BASE = "https://pb.booking.vallome.ru";

function iso(value: string): IsoDate {
  const parsed = parseIsoDate(value);
  if (parsed === null) {
    throw new Error(value);
  }
  return parsed;
}

function listingRecord(patch: Partial<PbListingRecord> = {}): PbListingRecord {
  return {
    id: "listing12345678",
    host: "user123456789ab",
    title: "Студия у метро",
    city: "Казань",
    address: "Казань, ул. Баумана, 1",
    geo: { lon: 49.12, lat: 55.79 },
    housing_type: "Квартира",
    placement_type: "studio",
    photos: ["room 1.jpg", "https://cdn.example/cover.jpg"],
    description: "Светлая студия",
    amenities: ["Wifi", "Кухня"],
    extras: ["Бассейн", "Парковка"],
    max_guests: 3,
    pets_allowed: true,
    cancellation_allowed: false,
    guests_forbidden: true,
    access_info: "Код 1234",
    house_rules: "Без вечеринок",
    extra_info: "Лифт",
    check_in_time: "14:00",
    check_out_time: "12:00",
    price_night: 4500,
    price_14: 4000,
    price_28: 3500,
    unique_prices: [
      { date: "2026-06-01", base: 9000 },
      { date: "", base: 1000 },
      { date: "2026-02-31", base: 1 },
      { date: "2026-06-02", base: "нет" },
      { nope: true },
    ],
    status: "pending",
    reject_reason: "Мало фото",
    rating: 4.5,
    reviews_count: 8,
    created: "2026-03-01 00:00:00.000Z",
    updated: "2026-03-02 10:00:00.000Z",
    ...patch,
  };
}

describe("listings", () => {
  test("виды жилья: точный HousingType уходит в placement_type", () => {
    expect(housingTypeToPb("apartment")).toEqual({ housing_type: "Квартира", placement_type: "apartment" });
    expect(housingTypeToPb("apartments")).toEqual({ housing_type: "Квартира", placement_type: "apartments" });
    expect(housingTypeToPb("studio")).toEqual({ housing_type: "Квартира", placement_type: "studio" });
    expect(housingTypeToPb("house")).toEqual({ housing_type: "Дом", placement_type: "house" });
    expect(housingTypeToPb("room")).toEqual({ housing_type: "Комната", placement_type: "room" });
  });

  test("вид жилья читается из placement_type, иначе из housing_type", () => {
    expect(housingTypeFromPb("Дом", "studio")).toBe("studio");
    expect(housingTypeFromPb("Квартира")).toBe("apartment");
    expect(housingTypeFromPb("Дом", "  ")).toBe("house");
    expect(housingTypeFromPb("Комната", "не-тип")).toBe("room");
    expect(housingTypeFromPb("Отель")).toBe("apartment");
    expect(housingTypeFromPb("неизвестно", "")).toBe("apartment");
  });

  test("удобства и дополнительные удобства ходят в обе стороны", () => {
    expect(amenityIdsToPb(["wifi", "kitchen", "wifi"])).toEqual(["Wifi", "Кухня"]);
    expect(amenityIdsFromPb(["Wifi", "Нет такого", "Кухня", "Wifi"])).toEqual(["wifi", "kitchen"]);
    expect(extraAmenityIdsToPb(["pool", "parking", "sauna"])).toEqual(["Бассейн", "Парковка", "Сауна"]);
    expect(extraAmenityIdsFromPb(["Сауна", "Камин", "чужое"])).toEqual(["sauna", "fireplace"]);
    expect(amenityIdsToPb([
      "wifi", "tv", "ac", "heater", "hairdryer", "iron", "kitchen", "washer", "dishes",
    ])).toEqual([
      "Wifi", "Телевизор", "Кондиционер", "Обогреватель", "Фен", "Утюг", "Кухня", "Стиральная машина", "Посуда",
    ]);
    expect(extraAmenityIdsToPb([
      "breakfast", "pool", "fireplace", "smoking", "gym", "selfCheckIn", "sauna", "parking",
    ])).toEqual([
      "Завтраки", "Бассейн", "Камин", "Разрешено курение", "Спортзал", "Самостоятельное заселение", "Сауна", "Парковка",
    ]);
  });

  test("статусы: moderation ↔ pending, rejected → archived", () => {
    const pairs: [Parameters<typeof listingStatusToPb>[0], PbListingStatus][] = [
      ["draft", "draft"],
      ["moderation", "pending"],
      ["published", "published"],
      ["archived", "archived"],
    ];
    for (const [site, pb] of pairs) {
      expect(listingStatusToPb(site)).toBe(pb);
    }
    expect(listingStatusFromPb("draft")).toBe("draft");
    expect(listingStatusFromPb("pending")).toBe("moderation");
    expect(listingStatusFromPb("published")).toBe("published");
    expect(listingStatusFromPb("archived")).toBe("archived");
    expect(listingStatusFromPb("rejected")).toBe("archived");
    expect(listingStatusFromPb("unknown")).toBe("archived");
    expect(listingWritableStatusToPb("draft")).toBe("draft");
    expect(listingWritableStatusToPb("moderation")).toBe("pending");
    expect(listingWritableStatusToPb("published")).toBe("pending");
    expect(listingWritableStatusToPb("archived")).toBe("archived");
  });

  test("город берётся явно или из первой части адреса", () => {
    expect(extractCityFromAddress("Москва, ул. Тверская, 1", "  Казань ")).toBe("Казань");
    expect(extractCityFromAddress("  Санкт-Петербург , Невский", "  ")).toBe("Санкт-Петербург");
    expect(extractCityFromAddress("Сочи")).toBe("Сочи");
    expect(extractCityFromAddress("")).toBe("");
  });

  test("pbListingToSiteListing собирает объявление, фото, цены и причину отказа", () => {
    const listing = pbListingToSiteListing(listingRecord(), BASE);
    expect(listing).toMatchObject({
      id: "listing12345678",
      ownerId: "user123456789ab",
      status: "moderation",
      rejectReason: "Мало фото",
      title: "Студия у метро",
      address: "Казань, ул. Баумана, 1",
      city: "Казань",
      housingType: "studio",
      description: "Светлая студия",
      amenityIds: ["wifi", "kitchen"],
      extraAmenityIds: ["pool", "parking"],
      maxGuests: 3,
      guestsForbidden: true,
      petsAllowed: true,
      cancellationAllowed: false,
      checkInTime: "14:00",
      checkOutTime: "12:00",
      accessInfo: "Код 1234",
      houseRules: "Без вечеринок",
      extraInfo: "Лифт",
      priceNight: 4500,
      priceFrom14: 4000,
      priceFrom28: 3500,
      updatedAt: "2026-03-02 10:00:00.000Z",
    });
    expect(listing.photos).toEqual([
      buildPbFileUrl(BASE, "listings", "listing12345678", "room 1.jpg"),
      "https://cdn.example/cover.jpg",
    ]);
    expect(listing.uniquePrices).toEqual([
      { date: "2026-06-01", base: 9000 },
      { date: "", base: 1000 },
    ]);
    expect(listing).not.toHaveProperty("rating");
    expect(listing).not.toHaveProperty("reviews_count");
  });

  test("unique_prices из JSON-строки и пустой город не попадают в мусор", () => {
    const listing = pbListingToSiteListing(listingRecord({
      city: "  ",
      reject_reason: "",
      unique_prices: JSON.stringify([{ date: "2026-07-01", base: 500 }]),
      photos: ["  ", "a.jpg"],
      status: "rejected",
    }));
    expect(listing.city).toBeUndefined();
    expect(listing.rejectReason).toBeUndefined();
    expect(listing.status).toBe("archived");
    expect(listing.uniquePrices).toEqual([{ date: iso("2026-07-01"), base: 500 }]);
    expect(listing.photos).toEqual([
      buildPbFileUrl(PUBLIC_POCKETBASE_URL, "listings", "listing12345678", "a.jpg"),
    ]);
  });

  test("siteListingToPbPayload не отдаёт rating, reviews_count и reject_reason", () => {
    const draft: ListingDraft = {
      ...emptyDraft("user123456789ab"),
      status: "moderation",
      title: "Дом",
      address: "Сочи, ул. Ленина, 2",
      housingType: "house",
      description: "Дом у моря",
      photos: [
        buildPbFileUrl(BASE, "listings", "listing12345678", "room 1.jpg"),
        "data:image/png;base64,abc",
        "https://cdn.example/cover.jpg",
      ],
      amenityIds: ["washer"],
      extraAmenityIds: ["gym"],
      maxGuests: 4,
      guestsForbidden: false,
      petsAllowed: false,
      cancellationAllowed: true,
      checkInTime: "15:00",
      checkOutTime: "11:00",
      accessInfo: "Ключ",
      houseRules: "Тишина",
      extraInfo: "",
      priceNight: 8000,
      priceFrom14: 7000,
      priceFrom28: 6000,
      uniquePrices: [{ date: iso("2026-08-01"), base: 12000 }],
      rejectReason: "нельзя отправлять",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const payload = siteListingToPbPayload(draft);
    expect(payload).toEqual({
      host: "user123456789ab",
      title: "Дом",
      city: "Сочи",
      address: "Сочи, ул. Ленина, 2",
      housing_type: "Дом",
      placement_type: "house",
      description: "Дом у моря",
      amenities: ["Стиральная машина"],
      extras: ["Спортзал"],
      max_guests: 4,
      pets_allowed: false,
      cancellation_allowed: true,
      guests_forbidden: false,
      access_info: "Ключ",
      house_rules: "Тишина",
      extra_info: "",
      check_in_time: "15:00",
      check_out_time: "11:00",
      price_night: 8000,
      price_14: 7000,
      price_28: 6000,
      unique_prices: [{ date: "2026-08-01", base: 12000 }],
      status: "pending",
      photos: ["room 1.jpg"],
    });
    expect(payload).not.toHaveProperty("rating");
    expect(payload).not.toHaveProperty("reviews_count");
    expect(payload).not.toHaveProperty("reject_reason");
    expect(siteListingToPbPayload(draft, "archived").status).toBe("archived");
    expect(siteListingToPbPayload({ ...draft, status: "published" }).status).toBe("pending");
    expect(siteListingToPbPayload({ ...draft, city: "Адлер", photos: [] }).city).toBe("Адлер");
    expect(siteListingToPbPayload({ ...draft, photos: ["data:image/png;base64,abc"] })).not.toHaveProperty("photos");
  });

  test("строка таблицы: archived → unpublished, unpublished → archived", () => {
    const row = pbListingToTableRow(listingRecord({ status: "archived", photos: ["cover.jpg"] }), BASE);
    expect(row).toEqual({
      id: "listing12345678",
      title: "Студия у метро",
      address: "Казань, ул. Баумана, 1",
      housingType: "studio",
      status: "unpublished",
      coverUrl: buildPbFileUrl(BASE, "listings", "listing12345678", "cover.jpg"),
    });
    expect(tableRowToPbPatch({ ...row, status: "unpublished" })).toMatchObject({
      city: "Казань",
      housing_type: "Квартира",
      placement_type: "studio",
      status: "archived",
    });
    expect(tableRowToPbPatch({ ...row, status: "moderation" }).status).toBe("pending");
    expect(tableRowToPbPatch({ ...row, status: "published" }).status).toBe("pending");
    expect(tableRowToPbPatch({ ...row, address: "ул. Баумана, 10" })).not.toHaveProperty("city");
    expect(tableRowToPbPatch({ ...row, address: "пр. Мира, 5" })).not.toHaveProperty("city");
    expect(tableRowToPbPatch({ ...row, address: "Сочи" })).not.toHaveProperty("city");
    expect(tableRowToPbPatch({ ...row, address: "ул. Баумана, 10" }, { city: " Казань " }).city).toBe("Казань");
    expect(pbListingToTableRow(listingRecord({ status: "rejected", photos: [] })).status).toBe("unpublished");
    expect(pbListingToTableRow(listingRecord({ status: "published" })).status).toBe("published");
  });
});
