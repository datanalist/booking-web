import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { bookingOverridesToBlockRanges } from "../../api/pocketbase";
import type { PbListingBlockRecord } from "../../api/pocketbase";
import { BookingCalendarAlert } from "./BookingCalendarAlert";
import type { BookingCalendarPort } from "./createListingCalendarPort";
import type { BookingCalendarLoad } from "./loadBookingCalendar";

const LISTING_ID = "listing-availability";

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

test("переключатель пишет блокировку и помнит день при смене даты", async () => {
  const user = userEvent.setup();
  const { port, blocks } = memoryBlocks();
  render(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      calendarPort={port}
      onOpenChange={() => undefined}
    />,
  );
  await ready();

  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  const enabled = screen.getByRole("switch", {
    name: "доступно для бронирования",
  });
  expect(enabled).toHaveAttribute("aria-checked", "true");
  await user.click(enabled);

  const blocked = screen.getByRole("switch", {
    name: "недоступно для бронирования",
  });
  expect(blocked).toHaveAttribute("aria-checked", "false");
  expect(screen.getByText("недоступно для бронирования")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "20 декабря" })).toHaveClass(
    "line-through",
  );
  await waitFor(() => {
    expect(blocks()).toEqual([
      { id: "block-0", listing: LISTING_ID, start: "2024-12-20", end: "2024-12-21" },
    ]);
  });

  await user.click(screen.getByRole("button", { name: "15 декабря" }));
  expect(
    screen.getByRole("switch", { name: "доступно для бронирования" }),
  ).toHaveAttribute("aria-checked", "true");

  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  expect(
    screen.getByRole("switch", { name: "недоступно для бронирования" }),
  ).toHaveAttribute("aria-checked", "false");

  await user.click(screen.getByRole("button", { name: "Следующий месяц" }));
  await user.click(screen.getByRole("button", { name: "20 января" }));
  expect(screen.getByRole("button", { name: "20 января" })).not.toHaveClass(
    "line-through",
  );
  expect(
    screen.getByRole("switch", { name: "доступно для бронирования" }),
  ).toHaveAttribute("aria-checked", "true");

  await user.click(screen.getByRole("button", { name: "Предыдущий месяц" }));
  expect(screen.getByRole("button", { name: "20 декабря" })).toHaveClass(
    "line-through",
  );
  expect(
    screen.getByRole("switch", { name: "недоступно для бронирования" }),
  ).toHaveAttribute("aria-checked", "false");
});

test("блокировка переживает закрытие алерта и новое открытие", async () => {
  const user = userEvent.setup();
  const { port, blocks } = memoryBlocks();
  const { rerender, unmount } = render(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      calendarPort={port}
      onOpenChange={() => undefined}
    />,
  );
  await ready();

  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  await user.click(
    screen.getByRole("switch", { name: "доступно для бронирования" }),
  );
  await waitFor(() => expect(blocks()).toHaveLength(1));

  rerender(
    <BookingCalendarAlert
      open={false}
      listingId={LISTING_ID}
      calendarPort={port}
      onOpenChange={() => undefined}
    />,
  );
  rerender(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      calendarPort={port}
      onOpenChange={() => undefined}
    />,
  );
  await ready();
  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  expect(screen.getByRole("button", { name: "20 декабря" })).toHaveClass(
    "line-through",
  );

  unmount();
  render(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      calendarPort={port}
      onOpenChange={() => undefined}
    />,
  );
  await ready();
  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  expect(screen.getByRole("button", { name: "20 декабря" })).toHaveClass(
    "line-through",
  );
  expect(
    screen.getByRole("switch", { name: "недоступно для бронирования" }),
  ).toHaveAttribute("aria-checked", "false");
});

test("день из listing_blocks можно снова сделать доступным", async () => {
  const user = userEvent.setup();
  const { port, blocks } = memoryBlocks([
    {
      id: "block-16",
      listing: LISTING_ID,
      start: "2024-12-16",
      end: "2024-12-17",
    },
  ]);
  render(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      calendarPort={port}
      onOpenChange={() => undefined}
    />,
  );
  await ready();

  await user.click(screen.getByRole("button", { name: "16 декабря" }));
  expect(screen.getByRole("button", { name: "16 декабря" })).toHaveClass(
    "line-through",
  );
  await user.click(
    screen.getByRole("switch", { name: "недоступно для бронирования" }),
  );
  expect(screen.getByRole("button", { name: "16 декабря" })).not.toHaveClass(
    "line-through",
  );
  expect(
    screen.getByRole("switch", { name: "доступно для бронирования" }),
  ).toHaveAttribute("aria-checked", "true");
  await waitFor(() => expect(blocks()).toEqual([]));
});

function ready(): Promise<void> {
  return waitFor(() => {
    expect(screen.getByRole("alertdialog")).toHaveAttribute("data-calendar-state", "ready");
  });
}

function memoryBlocks(initial: readonly PbListingBlockRecord[] = []): {
  port: BookingCalendarPort;
  blocks: () => PbListingBlockRecord[];
} {
  const state: BookingCalendarLoad = {
    listing: null,
    bookings: [],
    blocks: [...initial],
    baseUrl: "https://pb.example",
  };
  return {
    blocks: () => state.blocks,
    port: {
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
    },
  };
}
