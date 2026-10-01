import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { ConfirmedBookingsPanel } from "./ConfirmedBookingsPanel";

afterEach(cleanup);

function rowOf(guest: string): HTMLElement {
  const row = screen.getByText(guest).closest<HTMLElement>('[role="row"]');
  if (row === null) {
    throw new Error(`Row not found: ${guest}`);
  }
  return row;
}

test("menu trigger is enabled and offers «Открыть» only for requests", async () => {
  const user = userEvent.setup();
  render(<ConfirmedBookingsPanel query="" forceEmpty={false} />);
  const staying = within(rowOf("Симонов Степан")).getByRole("button", {
    name: "Меню бронирования",
  });
  expect(staying).toBeDisabled();

  await user.click(
    within(rowOf("Полякова Кристина")).getByRole("button", {
      name: "Меню бронирования",
    }),
  );
  expect(screen.getByRole("menuitem", { name: "Открыть" })).toBeInTheDocument();
});

test("accepting a cancel request removes the booking", async () => {
  const user = userEvent.setup();
  render(<ConfirmedBookingsPanel query="" forceEmpty={false} />);
  await user.click(
    within(rowOf("Полякова Кристина")).getByRole("button", {
      name: "Меню бронирования",
    }),
  );
  await user.click(screen.getByRole("menuitem", { name: "Открыть" }));
  await user.click(screen.getByRole("button", { name: "Принять" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText("Полякова Кристина")).not.toBeInTheDocument();
});

test("rejecting a date change drops the request status", async () => {
  const user = userEvent.setup();
  render(<ConfirmedBookingsPanel query="" forceEmpty={false} />);
  await user.click(
    within(rowOf("Орлова Мария")).getByRole("button", {
      name: "Меню бронирования",
    }),
  );
  await user.click(screen.getByRole("menuitem", { name: "Открыть" }));
  await user.click(screen.getByRole("button", { name: "Отклонить" }));
  expect(
    within(rowOf("Орлова Мария")).getByText("Предоплата внесена"),
  ).toBeInTheDocument();
});
