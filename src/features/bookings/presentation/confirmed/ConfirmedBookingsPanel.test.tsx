import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { cancelledBookingsStore } from "../cancelled/cancelledBookingsStore";
import { confirmedBookingsStore } from "./confirmedBookingsStore";
import { ConfirmedBookingsPanel } from "./ConfirmedBookingsPanel";
import { bookingReviewsStore } from "./review/bookingReviewsStore";

afterEach(() => {
  cleanup();
  confirmedBookingsStore.reset();
  cancelledBookingsStore.reset();
  bookingReviewsStore.reset();
});

function rowOf(guest: string): HTMLElement {
  const row = screen.getByText(guest).closest<HTMLElement>('[role="row"]');
  if (row === null) {
    throw new Error(`Row not found: ${guest}`);
  }
  return row;
}

function triggerOf(guest: string): HTMLElement {
  return within(rowOf(guest)).getByRole("button", { name: "Меню бронирования" });
}

function renderPanel(): ReturnType<typeof userEvent.setup> {
  render(<ConfirmedBookingsPanel query="" forceEmpty={false} />);
  return userEvent.setup();
}

test("menu offers a matching item per status; other statuses are disabled", async () => {
  const user = renderPanel();
  const expected: ReadonlyArray<readonly [string, string]> = [
    ["Иваненко Анна", "Отменить бронирование"],
    ["Полякова Кристина", "Открыть"],
    ["Петров Иван", "Оставить отзыв"],
  ];
  for (const [guest, item] of expected) {
    await user.click(triggerOf(guest));
    expect(screen.getByRole("menuitem", { name: item })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  }
  expect(triggerOf("Ковалев Леонид")).toBeDisabled();
  expect(triggerOf("Симонов Степан")).toBeDisabled();
});

test("only one row menu is open at a time", async () => {
  const user = renderPanel();
  await user.click(triggerOf("Полякова Кристина"));
  expect(screen.getAllByRole("menu")).toHaveLength(1);
  expect(screen.getByRole("menuitem", { name: "Открыть" })).toBeInTheDocument();

  await user.click(triggerOf("Иваненко Анна"));
  expect(screen.getAllByRole("menu")).toHaveLength(1);
  expect(
    screen.getByRole("menuitem", { name: "Отменить бронирование" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "Открыть" })).not.toBeInTheDocument();
  expect(triggerOf("Полякова Кристина")).toHaveAttribute("aria-expanded", "false");
});

test("the menu closes on a click outside and on its own trigger", async () => {
  const user = renderPanel();
  await user.click(triggerOf("Полякова Кристина"));
  await user.click(document.body);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();

  await user.click(triggerOf("Полякова Кристина"));
  await user.click(triggerOf("Полякова Кристина"));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("opening a dialog closes the menu", async () => {
  const user = renderPanel();
  await user.click(triggerOf("Полякова Кристина"));
  await user.click(screen.getByRole("menuitem", { name: "Открыть" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("accepting a cancel request removes the booking and records it as cancelled", async () => {
  const user = renderPanel();
  await user.click(triggerOf("Полякова Кристина"));
  await user.click(screen.getByRole("menuitem", { name: "Открыть" }));
  await user.click(screen.getByRole("button", { name: "Принять" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText("Полякова Кристина")).not.toBeInTheDocument();
  expect(cancelledBookingsStore.get()[0]?.id).toBe("confirmed-3");
});

test("accepting a date change applies the new dates and price", async () => {
  const user = renderPanel();
  await user.click(triggerOf("Орлова Мария"));
  await user.click(screen.getByRole("menuitem", { name: "Открыть" }));
  await user.click(screen.getByRole("button", { name: "Принять" }));
  const row = within(rowOf("Орлова Мария"));
  expect(row.getByText("06.12.24-12.12.24")).toBeInTheDocument();
  expect(row.getByText("18 130 ₽")).toBeInTheDocument();
  expect(cancelledBookingsStore.get().some((item) => item.id === "confirmed-6")).toBe(false);
});

test("rejecting a request returns each row to its own previous status", async () => {
  const user = renderPanel();
  for (const guest of ["Полякова Кристина", "Орлова Мария"]) {
    await user.click(triggerOf(guest));
    await user.click(screen.getByRole("menuitem", { name: "Открыть" }));
    await user.click(screen.getByRole("button", { name: "Отклонить" }));
  }
  expect(
    within(rowOf("Полякова Кристина")).getByText("Предоплата внесена"),
  ).toBeInTheDocument();
  expect(
    within(rowOf("Орлова Мария")).getByText("Ожидание предоплаты"),
  ).toBeInTheDocument();
  expect(cancelledBookingsStore.get().some((item) => item.id === "confirmed-3")).toBe(false);
});

test("cancelling an awaiting-prepayment booking removes it and records it as cancelled", async () => {
  const user = renderPanel();
  await user.click(triggerOf("Иваненко Анна"));
  await user.click(screen.getByRole("menuitem", { name: "Отменить бронирование" }));
  await user.click(screen.getByRole("button", { name: "Отправить" }));
  expect(screen.queryByText("Иваненко Анна")).not.toBeInTheDocument();
  expect(cancelledBookingsStore.get()[0]?.id).toBe("confirmed-1");
});
