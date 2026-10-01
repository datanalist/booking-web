import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { CONFIRMED_BOOKINGS_MOCK } from "../../confirmedBookingsMock";
import { asRequestBooking } from "../asRequestBooking";
import type { ConfirmedRequestBooking } from "../ConfirmedRequestBooking";
import { CancelRequestModal } from "./CancelRequestModal";

afterEach(cleanup);

function cancelRequestBooking(): ConfirmedRequestBooking {
  const found = CONFIRMED_BOOKINGS_MOCK.find((item) => item.id === "confirmed-3");
  const request = found === undefined ? null : asRequestBooking(found);
  if (request === null) {
    throw new Error("No cancel request booking confirmed-3");
  }
  return request;
}

test("shows dates, price, housing and guest of the cancellation request", () => {
  const booking = cancelRequestBooking();
  render(
    <CancelRequestModal
      booking={booking}
      onClose={() => undefined}
      onDecision={() => undefined}
    />,
  );

  expect(
    screen.getByRole("dialog", { name: "Запрос на отмену бронирования" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Клиент получит уведомление с вашим решением об отмене бронирования",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Даты" })).toBeInTheDocument();
  expect(screen.getByText("5-10 декабря")).toBeInTheDocument();
  expect(screen.getByText("5 ночей")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Стоимость" })).toBeInTheDocument();
  expect(screen.getByText("15 460 ₽")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Жилье" })).toBeInTheDocument();
  expect(screen.getByText(booking.housingTitle)).toBeInTheDocument();
  expect(screen.getByText(booking.housingAddress)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Клиент" })).toBeInTheDocument();
  expect(screen.getByText(booking.guestName)).toBeInTheDocument();
  expect(screen.getByText(booking.guestPhone)).toBeInTheDocument();
});

test("reports accept, reject and close", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onDecision = vi.fn();
  const { container } = render(
    <CancelRequestModal
      booking={cancelRequestBooking()}
      onClose={onClose}
      onDecision={onDecision}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Принять" }));
  await user.click(screen.getByRole("button", { name: "Отклонить" }));
  expect(onDecision.mock.calls).toEqual([["accept"], ["reject"]]);

  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  await user.keyboard("{Escape}");
  const overlay = container.firstElementChild;
  if (overlay === null) {
    throw new Error("overlay missing");
  }
  await user.pointer({ keys: "[MouseLeft]", target: overlay });
  expect(onClose).toHaveBeenCalledTimes(3);
});
