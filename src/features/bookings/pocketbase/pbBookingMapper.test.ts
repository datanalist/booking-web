import { describe, expect, test } from "vitest";
import { formatRub, rub } from "../../../lib/money";
import { bookingRequestId } from "../domain/BookingRequest";
import { rejectedBookingId } from "../domain/RejectedBooking";
import { bookingStay } from "../presentation/confirmed/stay/BookingStay";
import {
  pbBookingToCancelled,
  pbBookingToConfirmed,
  pbBookingToRejected,
  pbBookingToRequest,
} from "./pbBookingMapper";
import type { PbBookingRecord } from "./pbBookingTypes";

const BASE = "https://pb.example";
const DURING = new Date(2026, 9, 20, 12, 0, 0);
const CHECK_IN_DAY = new Date(2026, 9, 19, 0, 30, 0);
const BEFORE = new Date(2026, 9, 18, 12, 0, 0);
const CHECK_OUT_DAY = new Date(2026, 9, 22, 12, 0, 0);

const GUEST = {
  id: "g1",
  name: "Анна Иваненко",
  phone: "79001234567",
  avatar: "ava.jpg",
} as const;

const LISTING = {
  id: "l1",
  title: "Уютная студия",
  city: "Москва",
  address: "ул. Невская 48",
  photos: ["", "studio.jpg"],
} as const;

function record(
  patch: Partial<Omit<PbBookingRecord, "expand">> = {},
  expand: PbBookingRecord["expand"] = { guest: { ...GUEST }, listing: { ...LISTING } },
): PbBookingRecord {
  return {
    id: "b1",
    listing: "l1",
    guest: "g1",
    host: "h1",
    check_in: "2026-10-19",
    check_out: "2026-10-22",
    adults: 2,
    children: 1,
    pets: 0,
    guest_note: "тихо",
    total: 15460,
    prepay: 5000,
    remainder: 10460,
    commission: 2000,
    host_amount: 13460,
    prepaid_at: "",
    status: "pending_host",
    cancel_reason: "",
    cancel_comment: "",
    host_respond_until: "",
    prepay_until: "",
    requested_check_in: "",
    requested_check_out: "",
    ...patch,
    expand,
  };
}

describe("pbBookingToRequest", () => {
  test("форматирует гостя, жильё, даты и стоимость для pending_host", () => {
    expect(pbBookingToRequest(record(), BASE)).toEqual({
      id: bookingRequestId("b1"),
      guestName: "Анна Иваненко",
      guestPhone: "+7 (900) 123-45-67",
      guestAvatarUrl: `${BASE}/api/files/users/g1/ava.jpg`,
      listingTitle: "Уютная студия",
      listingAddress: "Москва, ул. Невская 48",
      listingPhotoUrl: `${BASE}/api/files/listings/l1/studio.jpg`,
      datesLabel: "19.10.26-22.10.26",
      priceLabel: formatRub(15460),
    });
  });

  test("собирает имя из first_name и last_name, если name пустое", () => {
    const row = record(
      {},
      {
        guest: { id: "g1", name: "  ", first_name: " Анна ", last_name: " Иваненко " },
        listing: { ...LISTING },
      },
    );
    expect(pbBookingToRequest(row)?.guestName).toBe("Анна Иваненко");
  });

  test("предпочитает name и не дублирует город в адресе", () => {
    const row = record(
      {},
      {
        guest: { id: "g1", name: "Мария", first_name: "Анна", last_name: "Иваненко" },
        listing: {
          id: "l1",
          title: "Дом",
          city: "Москва",
          address: "Москва, ул. Летняя 3",
          photos: ["https://cdn.example/house.jpg"],
        },
      },
    );
    const request = pbBookingToRequest(row, `${BASE}/`);
    expect(request?.guestName).toBe("Мария");
    expect(request?.listingAddress).toBe("Москва, ул. Летняя 3");
    expect(request?.listingPhotoUrl).toBe("https://cdn.example/house.jpg");
    expect(request?.guestAvatarUrl).toBe("");
  });

  test("без baseUrl оставляет путь файла относительным", () => {
    expect(pbBookingToRequest(record())?.guestAvatarUrl).toBe("/api/files/users/g1/ava.jpg");
  });

  test("возвращает null для пустого id и несуществующей даты", () => {
    expect(pbBookingToRequest(record({ id: "  " }))).toBeNull();
    expect(pbBookingToRequest(record({ check_out: "2026-02-30" }))).toBeNull();
    expect(pbBookingToRequest(record({ status: "confirmed" }))).toBeNull();
  });
});

describe("pbBookingToConfirmed", () => {
  test("считает остаток до prepay_until и 12:00, если срок не задан", () => {
    const now = new Date("2026-10-19T10:00:00.000Z");
    const until = new Date(now.getTime() + (11 * 60 + 59) * 60_000);
    const timed = pbBookingToConfirmed(
      record({ status: "awaiting_prepayment", prepay_until: until.toISOString() }),
      now,
    );
    const missing = pbBookingToConfirmed(
      record({ status: "awaiting_prepayment", prepay_until: "  " }),
      now,
    );
    const spaced = pbBookingToConfirmed(
      record({
        status: "awaiting_prepayment",
        prepay_until: "2026-10-19 21:59:00.000Z",
      }),
      now,
    );
    const expired = pbBookingToConfirmed(
      record({
        status: "awaiting_prepayment",
        prepay_until: "2026-10-19T09:00:00.000Z",
      }),
      now,
    );
    expect(timed?.status).toEqual({ kind: "awaitingPrepayment", remainingLabel: "11:59" });
    expect(missing?.status).toEqual({ kind: "awaitingPrepayment", remainingLabel: "12:00" });
    expect(spaced?.status).toEqual({ kind: "awaitingPrepayment", remainingLabel: "11:59" });
    expect(expired?.status).toEqual({ kind: "awaitingPrepayment", remainingLabel: "00:00" });
  });

  test("confirmed внутри [check_in, check_out) — проживание, иначе предоплата", () => {
    const row = record({ status: "confirmed" });
    expect(pbBookingToConfirmed(row, CHECK_IN_DAY)?.status).toEqual({ kind: "staying" });
    expect(pbBookingToConfirmed(row, DURING)?.status).toEqual({ kind: "staying" });
    expect(pbBookingToConfirmed(row, BEFORE)?.status).toEqual({ kind: "prepaymentPaid" });
    expect(pbBookingToConfirmed(row, CHECK_OUT_DAY)?.status).toEqual({ kind: "prepaymentPaid" });
  });

  test("completed остаётся завершённой арендой даже в даты проживания", () => {
    const row = pbBookingToConfirmed(record({ status: "completed" }), DURING);
    expect(row?.status).toEqual({ kind: "stayCompleted" });
    expect(row?.guestId).toBe("g1");
    expect(row?.listingId).toBe("l1");
  });

  test("cancel_requested хранит запрос отмены и прошлый статус confirmed", () => {
    const during = pbBookingToConfirmed(record({ status: "cancel_requested" }), DURING);
    const before = pbBookingToConfirmed(record({ status: "cancel_requested" }), BEFORE);
    expect(during?.status).toEqual({
      kind: "request",
      request: { kind: "cancel" },
      previousStatus: { kind: "staying" },
    });
    expect(before?.status).toEqual({
      kind: "request",
      request: { kind: "cancel" },
      previousStatus: { kind: "prepaymentPaid" },
    });
  });

  test("change_requested переносит запрошенные даты и цену", () => {
    const unpaid = pbBookingToConfirmed(
      record({
        status: "change_requested",
        requested_check_in: "2026-11-01T00:00:00.000Z",
        requested_check_out: "2026-11-05 12:00:00.000Z",
      }),
      BEFORE,
    );
    const paid = pbBookingToConfirmed(
      record({
        status: "change_requested",
        prepaid_at: "2026-10-01",
        requested_check_in: "2026-11-01",
        requested_check_out: "2026-11-05",
      }),
      DURING,
    );
    expect(unpaid?.status).toEqual({
      kind: "request",
      previousStatus: { kind: "awaitingPrepayment", remainingLabel: "12:00" },
      request: {
        kind: "changeDates",
        proposedStay: bookingStay("2026-11-01", "2026-11-05"),
        proposedPriceLabel: formatRub(15460),
      },
    });
    expect(paid?.status).toEqual({
      kind: "request",
      previousStatus: { kind: "staying" },
      request: {
        kind: "changeDates",
        proposedStay: bookingStay("2026-11-01", "2026-11-05"),
        proposedPriceLabel: formatRub(15460),
      },
    });
    expect(unpaid?.stay).toEqual(bookingStay("2026-10-19", "2026-10-22"));
  });
});

describe("отклонённые и отменённые", () => {
  test("отказ хозяина без предоплаты попадает в отклонённые", () => {
    const row = record({ status: "cancelled", cancel_reason: "host_timeout" });
    expect(pbBookingToRejected(row, BASE)).toEqual({
      id: rejectedBookingId("b1"),
      guestName: "Анна Иваненко",
      guestPhone: "+7 (900) 123-45-67",
      guestAvatarUrl: `${BASE}/api/files/users/g1/ava.jpg`,
      listingTitle: "Уютная студия",
      listingAddress: "Москва, ул. Невская 48",
      listingPhotoUrl: `${BASE}/api/files/listings/l1/studio.jpg`,
      datesLabel: "19.10.26-22.10.26",
      priceLabel: formatRub(15460),
    });
    expect(pbBookingToCancelled(row)).toBeNull();
  });

  test("отмена гостем и таймаут предоплаты попадают в отменённые", () => {
    const guest = record({ status: "cancelled", cancel_reason: "guest" });
    expect(pbBookingToCancelled(guest)).toEqual({
      id: "b1",
      guestName: "Анна Иваненко",
      guestPhone: "+7 (900) 123-45-67",
      guestAvatarUrl: "/api/files/users/g1/ava.jpg",
      housingTitle: "Уютная студия",
      housingAddress: "Москва, ул. Невская 48",
      housingPhotoUrl: "/api/files/listings/l1/studio.jpg",
      datesLabel: "19.10.26-22.10.26",
      price: rub(15460),
    });
    expect(pbBookingToRejected(guest)).toBeNull();
    expect(
      pbBookingToCancelled(record({ status: "cancelled", cancel_reason: "prepay_timeout" })),
    ).not.toBeNull();
  });
});
