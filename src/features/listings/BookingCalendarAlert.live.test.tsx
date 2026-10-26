import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { PbBookingRecord } from "../bookings/pocketbase/pbBookingTypes";
import type { ListingBookingCalendarData } from "./bookingCalendarFromBookings";
import { BookingCalendarAlert } from "./BookingCalendarAlert";

const load = vi.hoisted(() => vi.fn());

vi.mock("./loadListingBookingCalendar", () => ({
  loadListingBookingCalendar: (...args: unknown[]) => load(...args),
}));

const LISTING_ID = "qtxy0ehns08nrcx";

function record(patch: Partial<PbBookingRecord> = {}): PbBookingRecord {
  return {
    id: "bk0000000000001",
    listing: LISTING_ID,
    guest: "gst000000000001",
    host: "hst000000000001",
    check_in: "2026-10-05",
    check_out: "2026-10-10",
    adults: 1,
    children: 0,
    pets: 0,
    guest_note: "",
    total: 1,
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
      guest: { id: "gst000000000001", name: "Мария Соколова", phone: "79001234567" },
    },
    ...patch,
  };
}

function source(records: readonly PbBookingRecord[]): ListingBookingCalendarData {
  return {
    baseUrl: "https://pb.example",
    records,
    listing: {
      id: LISTING_ID,
      title: "Студия на Невской",
      city: "Москва",
      address: "ул. Невская 48",
      photos: [],
    },
    blocks: [{ id: "blk000000000001", listing: LISTING_ID, start: "2026-10-16", end: "2026-10-19" }],
  };
}

beforeEach(() => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 26, 12, 0, 0));
  load.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

test("до ответа PocketBase не показывает демо-гостей", () => {
  load.mockReturnValue(new Promise(() => undefined));
  render(
    <BookingCalendarAlert open listingId={LISTING_ID} onOpenChange={() => undefined} />,
  );

  expect(screen.queryByText("Анна Иваненко")).not.toBeInTheDocument();
  expect(screen.queryByText("Уютная студия в центре Москвы")).not.toBeInTheDocument();
  expect(screen.getByText("Октябрь 2026")).toBeInTheDocument();
  expect(load).toHaveBeenCalledWith(LISTING_ID);
});

test("показывает брони выбранного объявления и сменяет их вместе с месяцем", async () => {
  const user = userEvent.setup();
  load.mockResolvedValue(
    source([
      record(),
      record({
        id: "bk0000000000002",
        check_in: "2026-11-02",
        check_out: "2026-11-04",
        expand: { guest: { id: "gst000000000002", name: "Илья Орлов", phone: "" } },
      }),
    ]),
  );

  render(
    <BookingCalendarAlert open listingId={LISTING_ID} onOpenChange={() => undefined} />,
  );

  expect(await screen.findByText("Мария Соколова")).toBeInTheDocument();
  expect(screen.getByText("Студия на Невской")).toBeInTheDocument();
  expect(screen.getByText("5-10 октября")).toBeInTheDocument();
  expect(screen.queryByText("Анна Иваненко")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "5 октября" })).toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
  expect(screen.getByRole("button", { name: "10 октября" })).not.toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
  expect(screen.getByRole("button", { name: "16 октября" })).toHaveClass("line-through");

  await user.click(screen.getByRole("button", { name: "Следующий месяц" }));
  expect(screen.getByText("Илья Орлов")).toBeInTheDocument();
  expect(screen.queryByText("Мария Соколова")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "2 ноября" })).toHaveClass(
    "bg-[rgba(47,235,39,0.3)]",
  );
});
