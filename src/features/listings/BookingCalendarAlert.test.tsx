import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { bookingOverridesToBlockRanges } from "../../api/pocketbase";
import type { PbListingBlockRecord } from "../../api/pocketbase";
import type { PbBookingRecord } from "../bookings/pocketbase/pbBookingTypes";
import { BookingCalendarAlert } from "./BookingCalendarAlert";
import type { BookingCalendarPort } from "./createListingCalendarPort";
import type { BookingCalendarListing, BookingCalendarLoad } from "./loadBookingCalendar";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2024, 11, 15, 12, 0, 0));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

test("при open показывает заголовок, тексты и кнопки из макета", () => {
  render(
    <BookingCalendarAlert
      open
      onOpenChange={() => undefined}
    />,
  );

  const dialog = screen.getByRole("alertdialog");
  expect(dialog).toHaveAccessibleName("Календарь бронирования");
  expect(dialog.textContent).toContain("Декабрь 2024");
  expect(dialog.textContent).toContain("15 декабря");
  expect(dialog.textContent).toContain("доступно для бронирования");
  expect(dialog.textContent).toContain("Доступно для бронирования");
  expect(dialog.textContent).toContain("Не доступно для бронирования");
  expect(dialog.textContent).toContain("Забронировано");
  expect(dialog.textContent).not.toContain("Уютная студия в центре Москвы");
  expect(dialog.textContent).not.toContain("Москва, ул. Невская 48");
  expect(dialog.textContent).not.toContain("Анна Иваненко");
  expect(dialog.textContent).not.toContain("Леонид Фролов");
  expect(dialog.textContent).not.toContain("Александра Павловская");
  expect(dialog.textContent).not.toContain("+7 (900) 123-45-67");
  expect(screen.queryByRole("button", { name: /^Написать / })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Предыдущий месяц" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Следующий месяц" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("switch", { name: "доступно для бронирования" }),
  ).toBeInTheDocument();
});

test("крестик вызывает onOpenChange(false) и onCancel", async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  const onCancel = vi.fn();

  render(
    <BookingCalendarAlert
      open
      onOpenChange={onOpenChange}
      onCancel={onCancel}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test("Escape закрывает алерт через onOpenChange(false)", async () => {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();

  render(
    <BookingCalendarAlert open onOpenChange={onOpenChange} />,
  );

  await user.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("кнопки гостя и навигации месяца вызывают колбэки", async () => {
  const user = userEvent.setup();
  const onMessageGuest = vi.fn();
  const onDeleteBooking = vi.fn();
  const onPrevMonth = vi.fn();
  const onNextMonth = vi.fn();
  const port = memoryPort({
    bookings: [
      stay({
        id: "book-anna",
        check_in: "2024-12-05",
        check_out: "2024-12-10",
        expand: {
          guest: {
            id: "guest-anna",
            name: "Анна Ковалёва",
            phone: "+79005556677",
          },
        },
      }),
    ],
  });

  render(
    <BookingCalendarAlert
      open
      listingId="qtxy0ehns08nrcx"
      calendarPort={port}
      onOpenChange={() => undefined}
      onMessageGuest={onMessageGuest}
      onDeleteBooking={onDeleteBooking}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Предыдущий месяц" }));
  expect(onPrevMonth).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "Следующий месяц" }));
  expect(onNextMonth).toHaveBeenCalledTimes(1);

  await user.click(
    await screen.findByRole("button", { name: "Написать Анна Ковалёва" }),
  );
  expect(onMessageGuest).toHaveBeenCalledWith("book-anna");

  await user.click(
    screen.getByRole("button", {
      name: "Удалить бронирование Анна Ковалёва",
    }),
  );
  expect(onDeleteBooking).toHaveBeenCalledWith("book-anna");
});

test("подложка алерта серая #525353, карточка белая", () => {
  render(
    <BookingCalendarAlert open onOpenChange={() => undefined} />,
  );

  const overlay = document.querySelector("[data-booking-calendar-overlay]");
  expect(overlay).not.toBeNull();
  expect(overlay).toHaveClass("bg-[#525353]");
  expect(overlay?.className ?? "").not.toContain("bg-[#525353]/");
  expect(screen.getByRole("alertdialog")).toHaveClass("bg-white");
});

test("переключение месяца меняет заголовок и число дней", async () => {
  const user = userEvent.setup();
  render(
    <BookingCalendarAlert open onOpenChange={() => undefined} />,
  );

  expect(screen.getByText("Декабрь 2024")).toBeInTheDocument();
  expect(dayButtons("декабря")).toHaveLength(31);

  await user.click(screen.getByRole("button", { name: "Следующий месяц" }));
  expect(screen.getByText("Январь 2025")).toBeInTheDocument();
  expect(screen.queryByText("Декабрь 2024")).not.toBeInTheDocument();
  const january = dayButtons("января");
  expect(january).toHaveLength(31);
  for (const day of january) {
    expect(day).not.toHaveClass("line-through");
  }

  await user.click(screen.getByRole("button", { name: "Предыдущий месяц" }));
  expect(screen.getByText("Декабрь 2024")).toBeInTheDocument();
  expect(dayButtons("декабря")).toHaveLength(31);

  await user.click(screen.getByRole("button", { name: "Предыдущий месяц" }));
  expect(screen.getByText("Ноябрь 2024")).toBeInTheDocument();
  expect(dayButtons("ноября")).toHaveLength(30);
});

test("клик по дню меняет выбранный день и подпись", async () => {
  const user = userEvent.setup();
  render(
    <BookingCalendarAlert open onOpenChange={() => undefined} />,
  );

  expect(screen.getByRole("button", { name: "15 декабря" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText("15 декабря")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  expect(screen.getByRole("button", { name: "20 декабря" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "15 декабря" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.getByText("20 декабря")).toBeInTheDocument();
  expect(screen.queryByText("15 декабря")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "16 декабря" }));
  expect(screen.getByRole("button", { name: "16 декабря" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText("16 декабря")).toBeInTheDocument();
});

test("для забронированного дня переключатель недоступен", async () => {
  const user = userEvent.setup();
  const port = memoryPort({
    bookings: [
      stay({
        id: "book-night",
        check_in: "2024-12-05",
        check_out: "2024-12-06",
        expand: { guest: { id: "guest-1", name: "Анна Ковалёва", phone: "" } },
      }),
    ],
  });
  render(
    <BookingCalendarAlert
      open
      listingId="qtxy0ehns08nrcx"
      calendarPort={port}
      onOpenChange={() => undefined}
    />,
  );

  await user.click(screen.getByRole("button", { name: "5 декабря" }));
  const toggle = await screen.findByRole("switch", { name: "забронировано" });
  expect(toggle).toBeDisabled();
  expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(screen.getByRole("button", { name: "5 декабря" })).toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
  expect(screen.getByRole("button", { name: "5 декабря" })).not.toHaveClass(
    "line-through",
  );
  expect(screen.getByRole("button", { name: "6 декабря" })).not.toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
});

test("открывается на текущей дате и показывает брони объявления", async () => {
  vi.setSystemTime(new Date(2026, 9, 1, 8, 30, 0));
  const port = memoryPort({
    listing: {
      id: "qtxy0ehns08nrcx",
      title: "Номер в центре Казани",
      city: "Казань",
      address: "ул. Баумана 15",
      photos: ["cover.jpg"],
    },
    bookings: [
      stay({
        id: "book-october",
        check_in: "2026-10-18",
        check_out: "2026-10-25",
        expand: {
          guest: {
            id: "j3zmoc7k66kogmj",
            name: "Анна Ковалёва",
            phone: "+79005556677",
          },
        },
      }),
      stay({
        id: "book-cancelled",
        status: "cancelled",
        check_in: "2026-10-02",
        check_out: "2026-10-04",
        expand: { guest: { id: "guest-x", name: "Пётр Отменённый", phone: "+79001110000" } },
      }),
    ],
    blocks: [
      {
        id: "block-16",
        listing: "qtxy0ehns08nrcx",
        start: "2026-10-16",
        end: "2026-10-17",
      },
    ],
  });
  render(
    <BookingCalendarAlert
      open
      listingId="qtxy0ehns08nrcx"
      calendarPort={port}
      onOpenChange={() => undefined}
    />,
  );

  expect(await screen.findByText("Номер в центре Казани")).toBeInTheDocument();
  expect(screen.getByText("Казань, ул. Баумана 15")).toBeInTheDocument();
  expect(screen.getByText("Октябрь 2026")).toBeInTheDocument();
  expect(screen.getByText("1 октября")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "1 октября" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText("18-25 октября")).toBeInTheDocument();
  expect(screen.getByText("7 ночей")).toBeInTheDocument();
  expect(screen.getByText("+7 (900) 555-66-77")).toBeInTheDocument();
  expect(screen.queryByText("Пётр Отменённый")).not.toBeInTheDocument();
  expect(screen.queryByText("Анна Иваненко")).not.toBeInTheDocument();
  expect(screen.queryByText("Леонид Фролов")).not.toBeInTheDocument();
  expect(screen.queryByText("Александра Павловская")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "18 октября" })).toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
  expect(screen.getByRole("button", { name: "24 октября" })).toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
  expect(screen.getByRole("button", { name: "25 октября" })).not.toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
  expect(screen.getByRole("button", { name: "16 октября" })).toHaveClass(
    "line-through",
  );
});

const LISTING_ID = "qtxy0ehns08nrcx";

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

function memoryPort(seed: {
  listing?: BookingCalendarListing | null;
  bookings?: readonly PbBookingRecord[];
  blocks?: readonly PbListingBlockRecord[];
} = {}): BookingCalendarPort {
  const state: BookingCalendarLoad = {
    listing: seed.listing ?? null,
    bookings: seed.bookings ?? [],
    blocks: [...(seed.blocks ?? [])],
    baseUrl: "https://pb.example",
  };
  return {
    async load() {
      return {
        listing: state.listing,
        bookings: state.bookings,
        blocks: state.blocks.map((block) => ({ ...block })),
        baseUrl: state.baseUrl,
      };
    },
    async saveBlocks(listingId, overrides) {
      state.blocks = bookingOverridesToBlockRanges(overrides).map((range, index) => ({
        id: `block-${index}`,
        listing: listingId,
        start: range.start,
        end: range.end,
      }));
    },
  };
}

function dayButtons(genitiveMonth: string): HTMLElement[] {
  return screen.getAllByRole("button", {
    name: new RegExp(`^\\d+ ${genitiveMonth}$`),
  });
}

test("при open=false алерт не в документе", () => {
  render(
    <BookingCalendarAlert open={false} onOpenChange={() => undefined} />,
  );

  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});
