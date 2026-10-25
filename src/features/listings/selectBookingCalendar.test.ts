import { describe, expect, test } from "vitest";
import { blockRangesToBookingOverrides } from "../../api/pocketbase";
import type { PbListingBlockRecord } from "../../api/pocketbase";
import type { PbBookingRecord, PbBookingStatus } from "../bookings/pocketbase/pbBookingTypes";
import { emptyBookingDayOverrides } from "./BookingDayOverrides";
import { emptyBookingCalendarLoad, type BookingCalendarLoad } from "./loadBookingCalendar";
import { resolveCalendarDayMark } from "./resolveCalendarDayMark";
import {
  BOOKING_CALENDAR_OCCUPYING_STATUSES,
  selectBookingCalendar,
} from "./selectBookingCalendar";
import type { YearMonth } from "./YearMonth";

const LISTING_ID = "qtxy0ehns08nrcx";
const OCTOBER: YearMonth = { year: 2026, month: 10 };
const SEPTEMBER: YearMonth = { year: 2026, month: 9 };
const BASE = "https://pb.booking.vallome.ru";

describe("selectBookingCalendar", () => {
  test("подтверждённая бронь становится строкой и занятыми ночами, выезд свободен", () => {
    const selected = selectBookingCalendar(load({
      bookings: [stay({
        id: "book-october",
        status: "confirmed",
        check_in: "2026-10-18",
        check_out: "2026-10-25",
        expand: {
          guest: {
            id: "j3zmoc7k66kogmj",
            name: "Анна Ковалёва",
            phone: "+79005556677",
            avatar: "face.png",
          },
        },
      })],
    }), OCTOBER);

    expect(selected.panel.listingTitle).toBe("Номер в центре Казани");
    expect(selected.panel.listingAddress).toBe("Казань, ул. Баумана 15");
    const storedAddress = selectBookingCalendar(load({
      listing: {
        id: LISTING_ID,
        title: "Номер в центре Казани",
        city: "Казань",
        address: "ул. Баумана, 58, Казань",
        photos: ["cover.jpg"],
      },
    }), OCTOBER);
    expect(storedAddress.panel.listingAddress).toBe("ул. Баумана, 58, Казань");
    expect(selected.panel.listingCoverUrl).toContain(
      "/api/files/listings/qtxy0ehns08nrcx/cover.jpg",
    );
    expect(selected.panel.guests).toEqual([
      {
        id: "book-october",
        name: "Анна Ковалёва",
        phone: "+7 (900) 555-66-77",
        dates: "18-25 октября",
        nights: "7 ночей",
        avatarUrl: expect.stringContaining("/api/files/users/j3zmoc7k66kogmj/") as string,
        tone: "purple",
      },
    ]);
    expect(selected.marks.ranges).toEqual([
      { fromDay: 18, toDay: 24, tone: "purple" },
    ]);
    expect(mark(selected.marks, 18)).toEqual({ kind: "booked", tone: "purple" });
    expect(mark(selected.marks, 24)).toEqual({ kind: "booked", tone: "purple" });
    expect(mark(selected.marks, 25).kind).toBe("available");
    const blob = JSON.stringify(selected);
    expect(blob).not.toContain("Иваненко");
    expect(blob).not.toContain("Фролов");
    expect(blob).not.toContain("Павловская");
    expect(blob).not.toContain("Невская");
    expect(blob).not.toContain("123-45-67");
    expect(blob).not.toContain("Уютная студия");
    expect(blob).not.toContain("cover-studio");
  });

  test.each(BOOKING_CALENDAR_OCCUPYING_STATUSES)(
    "%s занимает календарь",
    (status) => {
      const selected = selectBookingCalendar(load({
        bookings: [stay({ status, check_in: "2026-10-13", check_out: "2026-10-14" })],
      }), OCTOBER);
      expect(selected.panel.guests).toHaveLength(1);
      expect(selected.panel.guests[0]?.dates).toBe("13-14 октября");
      expect(selected.panel.guests[0]?.nights).toBe("1 ночь");
      expect(mark(selected.marks, 13)).toEqual({ kind: "booked", tone: "purple" });
      expect(mark(selected.marks, 14).kind).toBe("available");
    },
  );

  test("cancelled, completed и cancel_requested не занимают дни", () => {
    const hidden = (status: PbBookingStatus, id: string, name: string): PbBookingRecord => stay({
      id,
      status,
      check_in: "2026-10-02",
      check_out: "2026-10-05",
      expand: { guest: { id: `g-${id}`, name, phone: "+79000000000" } },
    });
    const october = selectBookingCalendar(load({
      bookings: [
        hidden("cancelled", "book-cancelled", "Пётр Отменённый"),
        hidden("completed", "book-completed", "Ольга Прошлая"),
        hidden("cancel_requested", "book-cancel", "Иван Ждёт"),
        stay({
          id: "book-live",
          status: "confirmed",
          expand: { guest: { id: "j3zmoc7k66kogmj", name: "Анна Ковалёва", phone: "+79005556677" } },
        }),
      ],
    }), OCTOBER);
    expect(october.panel.guests.map((guest) => guest.name)).toEqual(["Анна Ковалёва"]);
    expect(october.marks.ranges).toEqual([{ fromDay: 18, toDay: 24, tone: "purple" }]);
    expect(mark(october.marks, 2).kind).toBe("available");
    expect(mark(october.marks, 4).kind).toBe("available");

    const september = selectBookingCalendar(load({
      bookings: [
        stay({
          id: "book-past",
          status: "completed",
          check_in: "2026-09-07",
          check_out: "2026-09-12",
          expand: { guest: { id: "j3zmoc7k66kogmj", name: "Анна Ковалёва", phone: "+79005556677" } },
        }),
      ],
    }), SEPTEMBER);
    expect(september.panel.guests).toEqual([]);
    expect(september.marks.ranges).toEqual([]);
  });

  test("пустой телефон не подменяется, а блок дня важнее только если день не забронирован", () => {
    const blocks: PbListingBlockRecord[] = [
      { id: "blk-booked", listing: LISTING_ID, start: "2026-10-18", end: "2026-10-19" },
      { id: "blk-free", listing: LISTING_ID, start: "2026-10-16", end: "2026-10-17" },
    ];
    const source = load({
      bookings: [stay({
        expand: { guest: { id: "j3zmoc7k66kogmj", name: "Анна Ковалёва" } },
      })],
      blocks,
    });
    const selected = selectBookingCalendar(source, OCTOBER);
    expect(selected.panel.guests[0]?.phone).toBe("");
    expect(selected.panel.guests[0]?.avatarUrl).toBe("/avatar-placeholder.png");
    const overrides = blockRangesToBookingOverrides(blocks);
    expect(resolveCalendarDayMark(OCTOBER, 18, selected.marks, overrides)).toEqual({
      kind: "booked",
      tone: "purple",
    });
    expect(resolveCalendarDayMark(OCTOBER, 16, selected.marks, overrides).kind).toBe("unavailable");
    expect(resolveCalendarDayMark(OCTOBER, 17, selected.marks, emptyBookingDayOverrides()).kind).toBe("available");
  });

  test("запрошенные даты тоже занимают ночи, подпись строки остаётся у текущих", () => {
    const selected = selectBookingCalendar(load({
      bookings: [stay({
        status: "change_requested",
        check_in: "2026-10-18",
        check_out: "2026-10-20",
        requested_check_in: "2026-10-22",
        requested_check_out: "2026-10-24",
      })],
    }), OCTOBER);
    expect(selected.panel.guests[0]?.dates).toBe("18-20 октября");
    expect(selected.panel.guests[0]?.nights).toBe("2 ночи");
    expect(mark(selected.marks, 18).kind).toBe("booked");
    expect(mark(selected.marks, 19).kind).toBe("booked");
    expect(mark(selected.marks, 20).kind).toBe("available");
    expect(mark(selected.marks, 22).kind).toBe("booked");
    expect(mark(selected.marks, 23).kind).toBe("booked");
    expect(mark(selected.marks, 24).kind).toBe("available");
  });

  test("без броней и без фото список пуст и обложка не из демо-студии", () => {
    const selected = selectBookingCalendar(load({
      listing: {
        id: LISTING_ID,
        title: "Номер в центре Казани",
        city: "Казань",
        address: "ул. Баумана 15",
        photos: [],
      },
      bookings: [],
    }), OCTOBER);
    expect(selected.panel.guests).toEqual([]);
    expect(selected.marks.ranges).toEqual([]);
    expect(selected.marks.unavailableDays).toEqual([]);
    expect(selected.panel.listingCoverUrl).toBe("/booking-listing-studio.svg");
    expect(selected.panel.listingCoverUrl).not.toContain("cover-studio");
  });
});

function mark(
  marks: ReturnType<typeof selectBookingCalendar>["marks"],
  day: number,
) {
  return resolveCalendarDayMark(
    { year: marks.year, month: marks.month },
    day,
    marks,
    emptyBookingDayOverrides(),
  );
}

function load(patch: Partial<BookingCalendarLoad> = {}): BookingCalendarLoad {
  return {
    ...emptyBookingCalendarLoad(BASE),
    listing: patch.listing === undefined ? {
      id: LISTING_ID,
      title: "Номер в центре Казани",
      city: "Казань",
      address: "ул. Баумана 15",
      photos: ["cover.jpg"],
    } : patch.listing,
    bookings: patch.bookings ?? [],
    blocks: patch.blocks ?? [],
    baseUrl: patch.baseUrl ?? BASE,
  };
}

function stay(patch: Partial<PbBookingRecord> = {}): PbBookingRecord {
  return {
    id: "book-1",
    listing: LISTING_ID,
    guest: "j3zmoc7k66kogmj",
    host: "6ekom84sgoqlzmz",
    check_in: "2026-10-18",
    check_out: "2026-10-25",
    adults: 1,
    children: 0,
    pets: 0,
    guest_note: "",
    total: 0,
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
    ...patch,
  };
}
