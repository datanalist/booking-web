import { describe, expect, test } from "vitest";
import { parseIsoDate, type IsoDate } from "../../lib/isoDate";
import type { BookingDayOverrides } from "../../features/listings/BookingDayOverrides";
import * as rootApi from "../index";
import {
  PUBLIC_POCKETBASE_URL,
  PbRequestError,
  blockRangesToBookingOverrides,
  bookingOverridesToBlockRanges,
  buildPbFileUrl,
  createPbClient,
  pbUserToSession,
  resolvePocketBaseUrl,
  sessionOrInputToPbUserPatch,
  siteListingToPbPayload,
  type PbFetch,
  type PbUserRecord,
} from "./index";

const BASE = "https://pb.booking.vallome.ru";

function iso(value: string): IsoDate {
  const parsed = parseIsoDate(value);
  if (parsed === null) {
    throw new Error(value);
  }
  return parsed;
}

function overrides(blocked: readonly string[], released: readonly string[] = []): BookingDayOverrides {
  return {
    blocked: new Set(blocked.map(iso)),
    released: new Set(released.map(iso)),
  };
}

function userRecord(patch: Partial<PbUserRecord> = {}): PbUserRecord {
  return {
    id: "user123456789ab",
    email: "anna@mail.ru",
    verified: true,
    name: "Анна Иванова",
    first_name: "Анна",
    last_name: "Иванова",
    birthdate: "1990-01-02",
    phone: "+79001234567",
    avatar: "",
    limited_browse: false,
    bio: "",
    roles: ["guest", "host"],
    account_status: "active",
    verified_host: false,
    years_hosting: 2,
    rating: 4.8,
    reviews_count: 3,
    balance: 1500,
    created: "2026-01-01 00:00:00.000Z",
    updated: "2026-01-02 00:00:00.000Z",
    ...patch,
  };
}

describe("users", () => {
  test("pbUserToSession связывает поля, баланс и URL аватара", () => {
    const session = pbUserToSession(userRecord({ avatar: "фото 1.png", balance: 0 }), `${BASE}/`);
    expect(session).toEqual({
      userId: "user123456789ab",
      email: "anna@mail.ru",
      name: "Анна Иванова",
      phone: "+79001234567",
      photoUrl: buildPbFileUrl(BASE, "_pb_users_auth_", "user123456789ab", "фото 1.png"),
      balance: 0,
      onboardingComplete: true,
    });
    expect(session.photoUrl).toContain(encodeURIComponent("фото 1.png"));
  });

  test("пустое name склеивается из first_name и last_name", () => {
    const session = pbUserToSession(userRecord({
      name: "   ",
      first_name: "Иван",
      last_name: "  Петров ",
      phone: "",
      avatar: "",
      balance: 20,
    }));
    expect(session.name).toBe("Иван Петров");
    expect(session.phone).toBe("");
    expect(session.onboardingComplete).toBe(false);
    expect(session).not.toHaveProperty("photoUrl");
    expect(session.balance).toBe(20);
  });

  test("онбординг требует и имя, и телефон", () => {
    expect(pbUserToSession(userRecord({ name: "Анна", phone: "   " })).onboardingComplete).toBe(false);
    expect(pbUserToSession(userRecord({ name: "", first_name: "", last_name: "", phone: "+7" })).onboardingComplete).toBe(false);
  });

  test("sessionOrInputToPbUserPatch раскладывает имя и нормализует телефон", () => {
    expect(sessionOrInputToPbUserPatch({
      name: "  Анна   Сергеевна  Петрова ",
      phone: "+7 (900) 123-45-67",
    })).toEqual({
      name: "Анна Сергеевна Петрова",
      first_name: "Анна",
      last_name: "Сергеевна Петрова",
      phone: "+79001234567",
    });
    expect(sessionOrInputToPbUserPatch({ name: "Мария", phone: "8 (900) 111-22-33" }).phone).toBe("+79001112233");
    expect(sessionOrInputToPbUserPatch({ name: "Мария", phone: "9001112233" })).toMatchObject({
      first_name: "Мария",
      last_name: "",
      phone: "+79001112233",
    });
  });
});

describe("listing_blocks", () => {
  test("соседние дни склеиваются, end — следующий день", () => {
    expect(bookingOverridesToBlockRanges(overrides([
      "2026-01-31",
      "2026-02-01",
      "2026-02-03",
    ]))).toEqual([
      { start: "2026-01-31", end: "2026-02-02" },
      { start: "2026-02-03", end: "2026-02-04" },
    ]);
    expect(bookingOverridesToBlockRanges(overrides([
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
    ]))).toEqual([
      { start: "2024-02-28", end: "2024-03-02" },
    ]);
  });

  test("released не пишется в блоки, чтение диапазона даёт только blocked", () => {
    const ranges = bookingOverridesToBlockRanges(overrides(["2026-05-01"], ["2026-05-02"]));
    expect(ranges).toEqual([{ start: "2026-05-01", end: "2026-05-02" }]);
    const back = blockRangesToBookingOverrides([
      { id: "block123456789a", listing: "listing12345678", start: "2026-03-01 00:00:00.000Z", end: "2026-03-03 00:00:00.000Z" },
      { start: "2026-04-02", end: "2026-04-02" },
      { start: "нет", end: "2026-04-05" },
    ]);
    expect([...back.blocked].sort()).toEqual(["2026-03-01", "2026-03-02"]);
    expect(back.released.size).toBe(0);
  });

  test("диапазоны и блокированные дни крутятся туда-обратно", () => {
    const source = overrides(["2026-06-10", "2026-06-11", "2026-06-13"]);
    const restored = blockRangesToBookingOverrides(bookingOverridesToBlockRanges(source));
    expect([...restored.blocked].sort()).toEqual(["2026-06-10", "2026-06-11", "2026-06-13"]);
  });
});

describe("pocketbase client", () => {
  test("публичный URL и file URL", () => {
    expect(resolvePocketBaseUrl()).toBe(PUBLIC_POCKETBASE_URL);
    expect(resolvePocketBaseUrl("https://example.test/")).toBe("https://example.test");
    expect(buildPbFileUrl(`${BASE}/`, "listings", "abc", "a b.jpg")).toBe(
      `${BASE}/api/files/listings/abc/${encodeURIComponent("a b.jpg")}`,
    );
  });

  test("auth-with-password, смена email и занятость ходят в нужные пути", async () => {
    const calls: { url: string; init: RequestInit | undefined }[] = [];
    const fetchFn: PbFetch = async (input, init) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
      calls.push({ url, init });
      if (url.includes("auth-with-password")) {
        return jsonResponse({ token: "tok", record: { id: "u1" } });
      }
      if (url.includes("change-email")) {
        return jsonResponse({ email: "next@mail.ru", pending: true });
      }
      if (url.includes("occupied-dates")) {
        return jsonResponse({ ranges: [{ start: "2026-01-01", end: "2026-01-02" }, { start: 1 }] });
      }
      if (url.includes("occupied-listings")) {
        return jsonResponse({ listingIds: ["a", 2, ""] });
      }
      if (url.includes("/records?")) {
        return jsonResponse({ page: 1, perPage: 20, totalItems: 0, totalPages: 0, items: [] });
      }
      return jsonResponse({ message: "Войдите в аккаунт" }, 401);
    };
    const client = createPbClient({
      baseUrl: `${BASE}/`,
      fetchFn,
      token: "token-1",
    });

    const auth = await client.authWithPassword("a@mail.ru", "secret12");
    expect(auth.token).toBe("tok");
    expect(calls[0]?.url).toBe(`${BASE}/api/collections/users/auth-with-password`);
    expect(calls[0]?.url).not.toContain("secret12");
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ identity: "a@mail.ru", password: "secret12" }));
    expect(new Headers(calls[0]?.init?.headers).get("Authorization")).toBe("Bearer token-1");

    await expect(client.changeEmail("next@mail.ru")).resolves.toEqual({
      email: "next@mail.ru",
      pending: true,
    });
    expect(calls[1]?.url).toBe(`${BASE}/api/vallome/change-email`);

    await expect(client.occupiedDates("listing12345678", "book1")).resolves.toEqual([
      { start: "2026-01-01", end: "2026-01-02" },
    ]);
    expect(calls[2]?.url).toContain("/api/vallome/occupied-dates?");
    expect(calls[2]?.url).toContain("listing=listing12345678");
    expect(calls[2]?.url).toContain("excludeBookingId=book1");

    await expect(client.occupiedListings("2026-01-01", "2026-01-05")).resolves.toEqual(["a"]);
    expect(calls[3]?.url).toContain("checkIn=2026-01-01");
    expect(calls[3]?.url).toContain("checkOut=2026-01-05");

    await client.listRecords("listings", { filter: 'status = "published"', page: 2 });
    expect(calls[4]?.url).toContain("/api/collections/listings/records?");
    expect(calls[4]?.url).toContain("page=2");
    expect(calls[4]?.init?.method).toBe("GET");

    await expect(client.getRecord("listings", "missing")).rejects.toBeInstanceOf(PbRequestError);
    await expect(client.getRecord("listings", "missing")).rejects.toThrow("Войдите в аккаунт");
  });
});

describe("barrel", () => {
  test("src/api реэкспортирует мапперы PocketBase", () => {
    expect(rootApi.pbUserToSession).toBe(pbUserToSession);
    expect(rootApi.createPbClient).toBe(createPbClient);
    expect(rootApi.siteListingToPbPayload).toBe(siteListingToPbPayload);
    expect(rootApi.bookingOverridesToBlockRanges).toBe(bookingOverridesToBlockRanges);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
