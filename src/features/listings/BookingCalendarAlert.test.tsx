import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BookingCalendarAlert } from "./BookingCalendarAlert";

beforeEach(() => {
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
  expect(dialog.textContent).toContain("Уютная студия в центре Москвы");
  expect(dialog.textContent).toContain("Москва, ул. Невская 48");
  expect(dialog.textContent).toContain("Анна Иваненко");
  expect(dialog.textContent).toContain("Леонид Фролов");
  expect(dialog.textContent).toContain("Александра Павловская");
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

  render(
    <BookingCalendarAlert
      open
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
    screen.getByRole("button", { name: "Написать Анна Иваненко" }),
  );
  expect(onMessageGuest).toHaveBeenCalledWith("anna");

  await user.click(
    screen.getByRole("button", {
      name: "Удалить бронирование Анна Иваненко",
    }),
  );
  expect(onDeleteBooking).toHaveBeenCalledWith("anna");
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
  const unavailable = screen.getByRole("button", { name: "16 декабря" });
  expect(unavailable).toHaveAttribute("aria-pressed", "true");
  expect(unavailable).toHaveClass("line-through");
  expect(screen.getByText("16 декабря")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "5 декабря" })).toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
});

test("для забронированного дня переключатель недоступен", async () => {
  const user = userEvent.setup();
  render(<BookingCalendarAlert open onOpenChange={() => undefined} />);

  await user.click(screen.getByRole("button", { name: "5 декабря" }));
  const toggle = screen.getByRole("switch", { name: "забронировано" });
  expect(toggle).toBeDisabled();
  expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(screen.getByRole("button", { name: "5 декабря" })).toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
  expect(screen.getByRole("button", { name: "5 декабря" })).not.toHaveClass(
    "line-through",
  );
});

test("открывается на текущей дате и показывает демо-брони этого месяца", () => {
  vi.setSystemTime(new Date(2026, 9, 1, 8, 30, 0));
  render(<BookingCalendarAlert open onOpenChange={() => undefined} />);

  expect(screen.getByText("Октябрь 2026")).toBeInTheDocument();
  expect(screen.getByText("1 октября")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "1 октября" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByText("5-10 октября")).toBeInTheDocument();
  expect(screen.getByText("13-14 октября")).toBeInTheDocument();
  expect(screen.getByText("21-23 октября")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "5 октября" })).toHaveClass(
    "bg-[rgba(77,56,232,0.23)]",
  );
  expect(screen.getByRole("button", { name: "16 октября" })).toHaveClass(
    "line-through",
  );
});

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
