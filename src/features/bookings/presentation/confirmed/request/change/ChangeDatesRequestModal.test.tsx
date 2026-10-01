import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { CONFIRMED_BOOKINGS_MOCK } from "../../confirmedBookingsMock";
import { asRequestBooking } from "../asRequestBooking";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";
import { ChangeDatesRequestModal } from "./ChangeDatesRequestModal";

afterEach(cleanup);

function changeDatesBooking(): ConfirmedRequestBooking {
  const found = CONFIRMED_BOOKINGS_MOCK.find((item) => item.id === "confirmed-6");
  const request = found === undefined ? null : asRequestBooking(found);
  if (request === null) {
    throw new Error("No change-dates request booking");
  }
  return request;
}

function renderModal(
  onClose: () => void = () => undefined,
  onDecision: (decision: "accept" | "reject") => void = () => undefined,
): void {
  render(
    <ChangeDatesRequestModal
      booking={changeDatesBooking()}
      onClose={onClose}
      onDecision={onDecision}
    />,
  );
}

function section(name: string): HTMLElement {
  const container = screen
    .getByRole("heading", { name, level: 3 })
    .closest("section");
  if (container === null) {
    throw new Error(`Section "${name}" not found`);
  }
  return container;
}

test("shows title and description", () => {
  renderModal();
  expect(
    screen.getByRole("dialog", {
      name: "Запрос на изменение сроков бронирования",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Клиент получит уведомление с вашим решением об изменении сроков бронирования",
    ),
  ).toBeInTheDocument();
});

test("shows housing and client blocks", () => {
  renderModal();
  const booking = changeDatesBooking();
  const housing = within(section("Жилье"));
  expect(housing.getByText(booking.housingTitle)).toBeInTheDocument();
  expect(housing.getByText(booking.housingAddress)).toBeInTheDocument();
  const client = within(section("Клиент"));
  expect(client.getByText(booking.guestName)).toBeInTheDocument();
  expect(client.getByText(booking.guestPhone)).toBeInTheDocument();
});

test("shows current terms of the booking", () => {
  renderModal();
  const current = within(section("Текущиие сроки бронирования"));
  expect(current.getByText("5-10 декабря")).toBeInTheDocument();
  expect(current.getByText("5 ночей")).toBeInTheDocument();
  expect(current.getByText("15 460 ₽")).toBeInTheDocument();
});

test("shows new terms from the request", () => {
  renderModal();
  const proposed = within(section("Новые сроки бронирования"));
  expect(proposed.getByText("6-12 декабря")).toBeInTheDocument();
  expect(proposed.getByText("6 ночей")).toBeInTheDocument();
  expect(proposed.getByText("18 130 ₽")).toBeInTheDocument();
});

test("reports decisions and closing", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onDecision = vi.fn();
  renderModal(onClose, onDecision);
  await user.click(screen.getByRole("button", { name: "Принять" }));
  await user.click(screen.getByRole("button", { name: "Отклонить" }));
  expect(onDecision.mock.calls).toEqual([["accept"], ["reject"]]);
  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
