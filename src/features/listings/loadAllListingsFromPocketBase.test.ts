import { expect, test } from "vitest";
import { createPbClient } from "../../api/pocketbase/pbClient";
import { loadAllListingsFromPocketBase } from "./loadAllListingsFromPocketBase";

const record = {
  id: "lst1",
  host: "user1",
  title: "У моря",
  city: "Сочи",
  address: "Сочи, ул. Моря 1",
  housing_type: "Квартира",
  placement_type: "apartment",
  description: "Тихо",
  photos: ["cover.jpg"],
  amenities: [],
  extras: [],
  max_guests: 2,
  guests_forbidden: false,
  pets_allowed: false,
  cancellation_allowed: true,
  check_in_time: "14:00",
  check_out_time: "12:00",
  access_info: "",
  house_rules: "",
  extra_info: "",
  price_night: 1000,
  price_14: 900,
  price_28: 800,
  unique_prices: [],
  status: "archived",
  reject_reason: "",
  rating: 0,
  reviews_count: 0,
  created: "2026-10-01 00:00:00.000Z",
  updated: "2026-10-02 00:00:00.000Z",
};

test("loadAllListingsFromPocketBase запрашивает объявления хозяина и мапит строки", async () => {
  let url = "";
  const client = createPbClient({
    baseUrl: "https://pb.example",
    fetchFn: async (input) => {
      url = String(input);
      return new Response(JSON.stringify({
        page: 1,
        perPage: 200,
        totalItems: 1,
        totalPages: 1,
        items: [record],
      }), { status: 200 });
    },
  });

  const rows = await loadAllListingsFromPocketBase(client, "user1");

  expect(url).toContain("/api/collections/listings/records");
  expect(url).toContain("filter=host%3D%22user1%22");
  expect(url).toContain("sort=-updated");
  expect(url).toContain("perPage=200");
  expect(rows).toEqual([{
    id: "lst1",
    title: "У моря",
    address: "Сочи, ул. Моря 1",
    housingType: "apartment",
    status: "unpublished",
    coverUrl: "https://pb.example/api/files/listings/lst1/cover.jpg",
  }]);
});
