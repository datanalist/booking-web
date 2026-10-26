import { expect, test } from "vitest";
import type { PbListingBlockRecord } from "../../api/pocketbase/pbTypes";
import type { PbBookingRecord } from "../bookings/pocketbase/pbBookingTypes";
import {
  bookingCalendarFromBookings,
  type ListingBookingCalendarData,
} from "./bookingCalendarFromBookings";

const OCTOBER = { year: 2026, month: 10 };
const BASE = "https://pb.example";

function record(patch: Partial<PbBookingRecord> = {}): PbBookingRecord {
  return {
    id: "bk0000000000001",
    listing: "qtxy0ehns08nrcx",
    guest: "gst000000000001",
    host: "hst000000000001",
    check_in: "2026-10-05",
    check_out: "2026-10-10",
    adults: 2,
    children: 0,
    pets: 0,
    guest_note: "",
    total: 10000,
    prepay: 0,
    remainder: 0,
    commission: 0,
    host_amount: 0,
    prepaid_at: "",
    status: "confirmed",
    cancel_reason: "",
    cancel_comment: "",
    host_respond_until: "",
    prepay_until: "",
    requested_check_in: "",
    requested_check_out: "",
    expand: {
      guest: {
        id: "gst000000000001",
        name: "Мария Соколова",
        phone: "79001234567",
        avatar: "ava.jpg",
      },
      listing: {
        id: "qtxy0ehns08nrcx",
        title: "Студия на Невской",
        city: "Москва",
        address: "ул. Невская 48",
        photos: ["cover.jpg"],
      },
    },
    ...patch,
  };
}

function data(
  records: readonly PbBookingRecord[],
  blocks: readonly PbListingBlockRecord[] = [],
): ListingBookingCalendarData {
  return {
    baseUrl: BASE,
    records,
    listing: records[0]?.expand?.listing ?? {
      id: "qtxy0ehns08nrcx",
      title: "Студия на Невской",
      city: "Москва",
      address: "ул. Невская 48",
      photos: ["cover.jpg"],
    },
    blocks,
  };
}

test("ночь брони красит дни заезда до выезда и собирает карточку гостя", () => {
  const view = bookingCalendarFromBookings(data([record()]), OCTOBER);

  expect(view.marks.ranges).toEqual([{ fromDay: 5, toDay: 9, tone: "purple" }]);
  expect(view.content.guests).toEqual([
    {
      id: "bk0000000000001",
      name: "Мария Соколова",
      phone: "+7 (900) 123-45-67",
      dates: "5-10 октября",
      nights: "5 ночей",
      avatarUrl: `${BASE}/api/files/users/gst000000000001/ava.jpg`,
      tone: "purple",
    },
  ]);
  expect(view.content.listingTitle).toBe("Студия на Невской");
  expect(view.content.listingAddress).toBe("Москва, ул. Невская 48");
  expect(view.content.listingCoverUrl).toBe(
    `${BASE}/api/files/listings/qtxy0ehns08nrcx/cover.jpg`,
  );
});

test("отменённые брони не попадают в календарь, цвета идут по дате заезда", () => {
  const view = bookingCalendarFromBookings(
    data([
      record({
        id: "bk0000000000003",
        status: "cancelled",
        cancel_reason: "guest",
        check_in: "2026-10-01",
        check_out: "2026-10-03",
        expand: {
          guest: { id: "gst000000000003", name: "Отменённый Гость", phone: "" },
        },
      }),
      record({
        id: "bk0000000000002",
        status: "pending_host",
        check_in: "2026-10-13",
        check_out: "2026-10-14",
        expand: {
          guest: { id: "gst000000000002", name: "Леонид Фролов", phone: "79007654321" },
        },
      }),
      record(),
    ]),
    OCTOBER,
  );

  expect(view.content.guests.map((guest) => guest.name)).toEqual([
    "Мария Соколова",
    "Леонид Фролов",
  ]);
  expect(view.marks.ranges.map((range) => range.tone)).toEqual(["purple", "green"]);
  expect(view.marks.ranges[1]).toEqual({ fromDay: 13, toDay: 13, tone: "green" });
});

test("бронь через границу месяца видна в обоих месяцах одним цветом", () => {
  const source = data([
    record({ check_in: "2026-10-30", check_out: "2026-11-03" }),
  ]);

  const october = bookingCalendarFromBookings(source, OCTOBER);
  const november = bookingCalendarFromBookings(source, { year: 2026, month: 11 });

  expect(october.marks.ranges).toEqual([{ fromDay: 30, toDay: 31, tone: "purple" }]);
  expect(november.marks.ranges).toEqual([{ fromDay: 1, toDay: 2, tone: "purple" }]);
  expect(october.content.guests[0]?.dates).toBe("30 октября - 3 ноября");
  expect(november.content.guests[0]?.nights).toBe("4 ночи");
});

test("блокировки объявления становятся недоступными днями, пустой гость получает заглушку", () => {
  const view = bookingCalendarFromBookings(
    data(
      [
        record({
          expand: { guest: { id: "gst000000000001", name: "", phone: "" } },
        }),
      ],
      [{ id: "blk000000000001", listing: "qtxy0ehns08nrcx", start: "2026-10-16", end: "2026-10-19" }],
    ),
    OCTOBER,
  );

  expect(view.marks.unavailableDays).toEqual([16, 17, 18]);
  expect(view.content.guests[0]?.name).toBe("Гость");
  expect(view.content.guests[0]?.avatarUrl).toBe("/avatar-placeholder.png");
});

test("в месяце без ночей карточки нет", () => {
  const view = bookingCalendarFromBookings(data([record()]), { year: 2026, month: 11 });
  expect(view.content.guests).toEqual([]);
  expect(view.marks.ranges).toEqual([]);
  expect(view.content.listingTitle).toBe("Студия на Невской");
});
