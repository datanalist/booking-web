import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { CONFIRMED_BOOKINGS_MOCK } from "../confirmedBookingsMock";
import { asRequestBooking } from "./asRequestBooking";
import { BookingRequestModal } from "./BookingRequestModal";
import type { ConfirmedRequestBooking } from "./ConfirmedRequestBooking";

afterEach(cleanup);

function requestBooking(id: string): ConfirmedRequestBooking {
  const found = CONFIRMED_BOOKINGS_MOCK.find((item) => item.id === id);
  const request = found === undefined ? null : asRequestBooking(found);
  if (request === null) {
    throw new Error(`No request booking ${id}`);
  }
  return request;
}

test("cancel request opens the cancellation modal", () => {
  render(
    <BookingRequestModal
      booking={requestBooking("confirmed-3")}
      onClose={() => undefined}
      onDecision={() => undefined}
    />,
  );
  expect(
    screen.getByRole("dialog", { name: "Запрос на отмену бронирования" }),
  ).toHaveAttribute("aria-modal", "true");
});

test("change-dates request opens the date change modal", () => {
  render(
    <BookingRequestModal
      booking={requestBooking("confirmed-6")}
      onClose={() => undefined}
      onDecision={() => undefined}
    />,
  );
  expect(
    screen.getByRole("dialog", {
      name: "Запрос на изменение сроков бронирования",
    }),
  ).toBeInTheDocument();
});

test("closes by X, Esc and overlay; reports decisions", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onDecision = vi.fn();
  const { container } = render(
    <BookingRequestModal
      booking={requestBooking("confirmed-3")}
      onClose={onClose}
      onDecision={onDecision}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  await user.keyboard("{Escape}");
  const overlay = container.firstElementChild;
  if (overlay === null) {
    throw new Error("overlay missing");
  }
  await user.pointer({ keys: "[MouseLeft]", target: overlay });
  expect(onClose).toHaveBeenCalledTimes(3);

  await user.click(screen.getByRole("button", { name: "Принять" }));
  await user.click(screen.getByRole("button", { name: "Отклонить" }));
  expect(onDecision.mock.calls).toEqual([["accept"], ["reject"]]);
});
