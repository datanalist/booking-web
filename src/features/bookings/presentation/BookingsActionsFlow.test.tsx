import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, test } from "vitest";
import { cancelledBookingsStore } from "./cancelled/cancelledBookingsStore";
import { confirmedBookingsStore } from "./confirmed/confirmedBookingsStore";
import { BookingsPage } from "./BookingsPage";

afterEach(() => {
  cleanup();
  confirmedBookingsStore.reset();
  cancelledBookingsStore.reset();
});

function guestRow(guest: string): HTMLElement {
  const row = screen.getByText(guest).closest<HTMLElement>('[role="row"]');
  if (row === null) {
    throw new Error(`Row not found: ${guest}`);
  }
  return row;
}

test("a cancelled booking moves to «Отменены» and stays there across tab switches without reload", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/bookings?tab=confirmed"]}>
      <Routes>
        <Route path="/bookings" element={<BookingsPage />} />
      </Routes>
    </MemoryRouter>,
  );

  await user.click(
    within(guestRow("Иваненко Анна")).getByRole("button", { name: "Меню бронирования" }),
  );
  await user.click(screen.getByRole("menuitem", { name: "Отменить бронирование" }));
  await user.click(screen.getByRole("button", { name: "Отправить" }));
  expect(screen.queryByText("Иваненко Анна")).not.toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Отменены" }));
  const firstDataRow = screen.getAllByRole("row")[1];
  expect(firstDataRow).toBeDefined();
  expect(within(firstDataRow as HTMLElement).getByText("Иваненко Анна")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(7); // header + 5 mock + 1 new

  await user.click(screen.getByRole("tab", { name: "Подтверждены" }));
  expect(screen.queryByText("Иваненко Анна")).not.toBeInTheDocument();
  expect(screen.getByText("Петров Иван")).toBeInTheDocument();
});
