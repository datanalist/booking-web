import { expect, test } from "vitest";
import { createPbClient } from "../../api/pocketbase";
import { loadListingBookingCalendar } from "./loadListingBookingCalendar";

const LISTING_ID = "qtxy0ehns08nrcx";

test("читает брони, объявление и блокировки этого listing", async () => {
  const urls: string[] = [];
  const client = createPbClient({
    baseUrl: "https://pb.example",
    fetchFn: async (input) => {
      const url = String(input);
      urls.push(url);
      if (url.includes(`/api/collections/listings/records/${LISTING_ID}`)) {
        return json({
          id: LISTING_ID,
          title: "Студия на Невской",
          city: "Москва",
          address: "ул. Невская 48",
          photos: ["cover.jpg"],
        });
      }
      if (url.includes("/api/collections/bookings/records")) {
        return json({
          page: 1,
          perPage: 200,
          totalItems: 1,
          totalPages: 1,
          items: [{ id: "bk0000000000001", listing: LISTING_ID, status: "confirmed" }],
        });
      }
      if (url.includes("/api/collections/listing_blocks/records")) {
        return json({
          page: 1,
          perPage: 200,
          totalItems: 1,
          totalPages: 1,
          items: [{ id: "blk000000000001", listing: LISTING_ID, start: "2026-10-16", end: "2026-10-19" }],
        });
      }
      return new Response("missing", { status: 404 });
    },
  });

  const loaded = await loadListingBookingCalendar(LISTING_ID, client);
  const bookingUrl = decodeURIComponent(urls.find((url) => url.includes("/bookings/")) ?? "");
  expect(bookingUrl).toContain(`listing="${LISTING_ID}"`);
  expect(bookingUrl).toContain("expand=guest,listing");
  expect(loaded.listing?.title).toBe("Студия на Невской");
  expect(loaded.records).toHaveLength(1);
  expect(loaded.blocks).toHaveLength(1);
  expect(loaded.baseUrl).toBe("https://pb.example");
});

test("вторая страница броней дочитывается", async () => {
  const pages: string[] = [];
  const client = createPbClient({
    baseUrl: "https://pb.example",
    fetchFn: async (input) => {
      const url = String(input);
      if (!url.includes("/bookings/")) {
        return new Response("no", { status: 404 });
      }
      const page = new URL(url).searchParams.get("page");
      pages.push(page ?? "");
      const item = { id: page === "1" ? "bk0000000000001" : "bk0000000000002" };
      return json({
        page: Number(page),
        perPage: 200,
        totalItems: 2,
        totalPages: 2,
        items: [item],
      });
    },
  });

  const loaded = await loadListingBookingCalendar(LISTING_ID, client);
  expect(pages).toEqual(["1", "2"]);
  expect(loaded.records.map((record) => record.id)).toEqual([
    "bk0000000000001",
    "bk0000000000002",
  ]);
  expect(loaded.listing).toBeNull();
  expect(loaded.blocks).toEqual([]);
});

test("чужой id не запрашивает PocketBase", async () => {
  let calls = 0;
  const client = createPbClient({
    baseUrl: "https://pb.example",
    fetchFn: async () => {
      calls += 1;
      return new Response("no", { status: 500 });
    },
  });

  const loaded = await loadListingBookingCalendar("demo", client);
  expect(calls).toBe(0);
  expect(loaded.records).toEqual([]);
});

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}
