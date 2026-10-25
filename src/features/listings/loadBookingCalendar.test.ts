import { afterEach, expect, test, vi } from "vitest";
import { createPbClient, type PbFetch } from "../../api/pocketbase";
import { parseIsoDate } from "../../lib/isoDate";
import { emptyBookingDayOverrides } from "./BookingDayOverrides";
import { createListingCalendarPort } from "./createListingCalendarPort";
import { loadBookingCalendar, replaceListingBlocks } from "./loadBookingCalendar";
import { toggleBookingDayAvailability } from "./toggleBookingDayAvailability";

const LISTING_ID = "qtxy0ehns08nrcx";
const BASE = "https://pb.example";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

test("загрузка читает объявление, брони и блоки токеном сессии", async () => {
  const calls: { url: string; method: string; auth: string | null }[] = [];
  const client = createPbClient({
    baseUrl: BASE,
    token: "host-session-token",
    fetchFn: fetchRecording(calls, (url) => {
      if (url.includes("/listings/records/")) {
        return json({
          id: LISTING_ID,
          title: "Номер в центре Казани",
          city: "Казань",
          address: "ул. Баумана 15",
          photos: ["cover.jpg"],
        });
      }
      if (url.includes("/bookings/records")) {
        const page = new URL(url).searchParams.get("page");
        if (page === "2") {
          return json(listPage([{ id: "book-2", status: "cancelled" }]));
        }
        return json({ ...listPage([{ id: "book-1", status: "confirmed" }]), totalPages: 2, totalItems: 2 });
      }
      return json(listPage([]));
    }),
  });

  const loaded = await loadBookingCalendar(client, LISTING_ID);
  expect(loaded.listing?.title).toBe("Номер в центре Казани");
  expect(loaded.bookings.map((booking) => booking.id)).toEqual(["book-1", "book-2"]);
  expect(loaded.baseUrl).toBe(BASE);
  const urls = calls.map((call) => call.url).join("\n");
  expect(urls).toContain(`/api/collections/listings/records/${LISTING_ID}`);
  expect(urls).toContain("/api/collections/bookings/records");
  expect(urls).toContain("expand=guest");
  expect(urls).toContain("/api/collections/listing_blocks/records");
  expect(urls).toContain(LISTING_ID);
  expect(urls).not.toContain("_superusers");
  expect(calls.every((call) => call.auth === "Bearer host-session-token")).toBe(true);
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

test("id не из PocketBase и отсутствие токена не вызывают сеть", async () => {
  const fetchFn = vi.fn<PbFetch>(async () => json({}));
  vi.stubGlobal("fetch", fetchFn);
  const client = createPbClient({ baseUrl: BASE, token: "host-session-token", fetchFn });
  const skipped = await loadBookingCalendar(client, "mock-2");
  expect(skipped.bookings).toEqual([]);
  expect(fetchFn).not.toHaveBeenCalled();

  localStorage.clear();
  const port = createListingCalendarPort(localStorage);
  await port.load(LISTING_ID);
  await port.saveBlocks(LISTING_ID, emptyBookingDayOverrides());
  expect(fetchFn).not.toHaveBeenCalled();
});

test("переключатель заменяет listing_blocks диапазоном дня", async () => {
  const calls: { url: string; method: string; body: string | undefined; auth: string | null }[] = [];
  const client = createPbClient({
    baseUrl: BASE,
    token: "host-session-token",
    fetchFn: async (input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      calls.push({
        url,
        method,
        body: typeof init?.body === "string" ? init.body : undefined,
        auth: new Headers(init?.headers).get("Authorization"),
      });
      if (method === "GET") {
        return json(listPage([{
          id: "oldblock1234567",
          listing: LISTING_ID,
          start: "2026-10-01",
          end: "2026-10-02",
        }]));
      }
      return json({});
    },
  });
  const day = parseIsoDate("2026-10-16");
  if (day === null) {
    throw new Error("date");
  }
  const overrides = toggleBookingDayAvailability(emptyBookingDayOverrides(), day, "available");
  await replaceListingBlocks(client, LISTING_ID, overrides);
  const deleted = calls.find((call) => call.method === "DELETE");
  const created = calls.find((call) => call.method === "POST");
  expect(deleted?.url).toContain("/listing_blocks/records/oldblock1234567");
  expect(created?.body).toBe(JSON.stringify({
    listing: LISTING_ID,
    start: "2026-10-16",
    end: "2026-10-17",
  }));
  expect(calls.every((call) => call.auth === "Bearer host-session-token")).toBe(true);
  expect(calls.map((call) => call.url).join("\n")).not.toContain("_superusers");
});

function fetchRecording(
  calls: { url: string; method: string; auth: string | null }[],
  respond: (url: string) => Response,
): PbFetch {
  return async (input, init) => {
    const url = requestUrl(input);
    calls.push({
      url,
      method: init?.method ?? "GET",
      auth: new Headers(init?.headers).get("Authorization"),
    });
    return respond(url);
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function listPage(items: readonly unknown[]): {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: readonly unknown[];
} {
  return { page: 1, perPage: 200, totalItems: items.length, totalPages: 1, items };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
