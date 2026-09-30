import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BookingCalendarAlert } from "./BookingCalendarAlert";

const LISTING_ID = "listing-availability";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2024, 11, 15, 12, 0, 0));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

test("переключатель меняет подпись и отметку и помнит день при смене даты", async () => {
  const user = userEvent.setup();
  render(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      onOpenChange={() => undefined}
    />,
  );

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
  const { rerender, unmount } = render(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      onOpenChange={() => undefined}
    />,
  );

  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  await user.click(
    screen.getByRole("switch", { name: "доступно для бронирования" }),
  );

  rerender(
    <BookingCalendarAlert
      open={false}
      listingId={LISTING_ID}
      onOpenChange={() => undefined}
    />,
  );
  rerender(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      onOpenChange={() => undefined}
    />,
  );
  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  expect(screen.getByRole("button", { name: "20 декабря" })).toHaveClass(
    "line-through",
  );

  unmount();
  render(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      onOpenChange={() => undefined}
    />,
  );
  await user.click(screen.getByRole("button", { name: "20 декабря" }));
  expect(screen.getByRole("button", { name: "20 декабря" })).toHaveClass(
    "line-through",
  );
  expect(
    screen.getByRole("switch", { name: "недоступно для бронирования" }),
  ).toHaveAttribute("aria-checked", "false");
});

test("демо-недоступный день можно снова сделать доступным", async () => {
  const user = userEvent.setup();
  render(
    <BookingCalendarAlert
      open
      listingId={LISTING_ID}
      onOpenChange={() => undefined}
    />,
  );

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
});
