import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { BookingCalendarAlert } from "./BookingCalendarAlert";

afterEach(() => {
  cleanup();
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
  const onAvailabilityChange = vi.fn();

  render(
    <BookingCalendarAlert
      open
      onOpenChange={() => undefined}
      onMessageGuest={onMessageGuest}
      onDeleteBooking={onDeleteBooking}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
      onAvailabilityChange={onAvailabilityChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Предыдущий месяц" }));
  expect(onPrevMonth).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "Следующий месяц" }));
  expect(onNextMonth).toHaveBeenCalledTimes(1);

  await user.click(
    screen.getByRole("switch", { name: "доступно для бронирования" }),
  );
  expect(onAvailabilityChange).toHaveBeenCalledWith(false);

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

test("при open=false алерт не в документе", () => {
  render(
    <BookingCalendarAlert open={false} onOpenChange={() => undefined} />,
  );

  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});
