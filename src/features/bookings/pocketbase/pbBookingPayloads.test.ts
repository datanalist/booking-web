import { describe, expect, test } from "vitest";
import { confirmedBookingId } from "../presentation/confirmed/ConfirmedBookingId";
import type { BookingReview } from "../presentation/confirmed/review/BookingReview";
import {
  buildAcceptBookingRequestPayload,
  buildHostCancelBookingPayload,
  buildHostGuestReviewPayload,
  buildRejectBookingRequestPayload,
  buildResolveBookingRequestPayload,
  pbBookingToCancelled,
  pbBookingToConfirmed,
  pbBookingToRejected,
  pbBookingToRequest,
} from "./pbBookingMapper";
import type { PbBookingRecord, PbBookingStatus, PbCancelReason } from "./pbBookingTypes";

const BASE = "https://pb.example";
const DURING = new Date(2026, 9, 20, 12, 0, 0);
const BEFORE = new Date(2026, 9, 18, 12, 0, 0);

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

function placed(row: PbBookingRecord, now: Date = DURING): string[] {
  const tabs: string[] = [];
  if (pbBookingToRequest(row, BASE) !== null) tabs.push("requests");
  if (pbBookingToConfirmed(row, now, BASE) !== null) tabs.push("confirmed");
  if (pbBookingToRejected(row, BASE) !== null) tabs.push("rejected");
  if (pbBookingToCancelled(row, BASE) !== null) tabs.push("cancelled");
  return tabs;
}

describe("вкладки кабинета", () => {
  const change = record({
    status: "change_requested",
    requested_check_in: "2026-11-01T00:00:00.000Z",
    requested_check_out: "2026-11-05 12:00:00.000Z",
  });

  const cases: ReadonlyArray<readonly [string, string, PbBookingRecord]> = [
    ["pending_host", "requests", record()],
    ["awaiting_prepayment", "confirmed", record({ status: "awaiting_prepayment" })],
    ["confirmed", "confirmed", record({ status: "confirmed" })],
    ["completed", "confirmed", record({ status: "completed" })],
    ["cancel_requested", "confirmed", record({ status: "cancel_requested" })],
    ["change_requested", "confirmed", change],
    ["cancelled host", "rejected", record({ status: "cancelled", cancel_reason: "host" })],
    [
      "cancelled host_timeout",
      "rejected",
      record({ status: "cancelled", cancel_reason: "host_timeout" }),
    ],
    ["cancelled guest", "cancelled", record({ status: "cancelled", cancel_reason: "guest" })],
    [
      "cancelled prepay_timeout",
      "cancelled",
      record({ status: "cancelled", cancel_reason: "prepay_timeout" }),
    ],
    [
      "cancelled host after prepay",
      "cancelled",
      record({
        status: "cancelled",
        cancel_reason: "host",
        prepaid_at: "2026-10-18T12:00:00.000Z",
      }),
    ],
  ];

  test.each(cases)("%s попадает только во вкладку %s", (_label, tab, row) => {
    expect(placed(row)).toEqual([tab]);
  });

  test("отмена без причины и без предоплаты остаётся в отменённых", () => {
    expect(placed(record({ status: "cancelled", cancel_reason: "" }))).toEqual(["cancelled"]);
  });

  test("перенос без упорядоченных дат остаётся в подтверждённых", () => {
    const inverted = record({
      status: "change_requested",
      requested_check_in: "2026-11-05",
      requested_check_out: "2026-11-01",
    });
    const empty = record({
      status: "change_requested",
      requested_check_in: "",
      requested_check_out: "",
    });
    expect(placed(inverted)).toEqual(["confirmed"]);
    expect(placed(empty)).toEqual(["confirmed"]);
    expect(pbBookingToConfirmed(inverted, DURING)?.status).toEqual({ kind: "staying" });
    expect(pbBookingToConfirmed(empty, BEFORE)?.status).toEqual({ kind: "prepaymentPaid" });
  });
});

describe("payload обновления bookings", () => {
  test("принятие запроса ждёт предоплату", () => {
    expect(buildAcceptBookingRequestPayload()).toEqual({ status: "awaiting_prepayment" });
  });

  test("отказ и отмена хозяином пишут причину host и обрезают комментарий", () => {
    const comment = `  ${"я".repeat(510)}  `;
    const expected = {
      status: "cancelled",
      cancel_reason: "host",
      cancel_comment: "я".repeat(500),
    };
    expect(buildRejectBookingRequestPayload(comment)).toEqual(expected);
    expect(buildHostCancelBookingPayload("  нет мест  ")).toEqual({
      status: "cancelled",
      cancel_reason: "host",
      cancel_comment: "нет мест",
    });
  });

  test("решение по запросу следует bookings_status.pb.js", () => {
    const cancel = pbBookingToConfirmed(record({ status: "cancel_requested" }), DURING);
    const change = pbBookingToConfirmed(
      record({
        status: "change_requested",
        requested_check_in: "2026-11-01",
        requested_check_out: "2026-11-05",
      }),
      DURING,
    );
    if (cancel === null || change === null) {
      throw new Error("request bookings were not mapped");
    }
    expect(buildResolveBookingRequestPayload(cancel, "accept")).toEqual({
      status: "cancelled",
      cancel_reason: "guest",
    });
    expect(buildResolveBookingRequestPayload(cancel, "reject")).toEqual({
      status: "confirmed",
    });
    expect(buildResolveBookingRequestPayload(change, "accept")).toEqual({
      status: "confirmed",
      check_in: "2026-11-01",
      check_out: "2026-11-05",
    });
    expect(buildResolveBookingRequestPayload(change, "reject")).toEqual({
      status: "confirmed",
      requested_check_in: "",
      requested_check_out: "",
    });
  });

  test("решение без открытого запроса недоступно", () => {
    const confirmed = pbBookingToConfirmed(record({ status: "confirmed" }), BEFORE);
    expect(confirmed?.id).toBe(confirmedBookingId("b1"));
    expect(() => buildResolveBookingRequestPayload(confirmed!, "accept")).toThrow(
      "Booking has no open request",
    );
  });
});

describe("buildHostGuestReviewPayload", () => {
  const review: BookingReview = {
    bookingId: confirmedBookingId("b1"),
    rating: 5,
    comment: "Аккуратный гость",
  };

  test("создаёт отзыв kind guest о госте этой брони", () => {
    expect(
      buildHostGuestReviewPayload({
        review,
        authorId: "h1",
        guestId: "g1",
        listingId: "l1",
      }),
    ).toEqual({
      kind: "guest",
      booking: "b1",
      author: "h1",
      subject: "g1",
      listing: "l1",
      rating: 5,
      comment: "Аккуратный гость",
    });
  });

  test("не подставляет пустые subject и listing", () => {
    expect(buildHostGuestReviewPayload({ review, authorId: "h1", guestId: "" })).toEqual({
      kind: "guest",
      booking: "b1",
      author: "h1",
      rating: 5,
      comment: "Аккуратный гость",
    });
  });
});

describe("все статусы", () => {
  const statuses: readonly PbBookingStatus[] = [
    "pending_host",
    "awaiting_prepayment",
    "confirmed",
    "completed",
    "cancel_requested",
    "change_requested",
    "cancelled",
  ];

  test("каждый из семи статусов разбирается ровно одним правилом вкладки", () => {
    const reasons: Partial<Record<PbBookingStatus, PbCancelReason>> = {
      cancelled: "guest",
    };
    for (const status of statuses) {
      const row = record({
        status,
        cancel_reason: reasons[status] ?? "",
        requested_check_in: "2026-11-01",
        requested_check_out: "2026-11-05",
      });
      expect(placed(row)).toHaveLength(1);
    }
  });
});
