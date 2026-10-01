import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BookingsPage } from "../BookingsPage";

afterEach(() => {
  cleanup();
});

function renderBookings(entry: string): void {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/bookings" element={<BookingsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

test("cancelled tab shows five mock rows", () => {
  renderBookings("/bookings?tab=cancelled");
  expect(screen.getByRole("heading", { name: "Бронирования" })).toBeInTheDocument();
  expect(screen.getByText("Иваненко Анна")).toBeInTheDocument();
  expect(screen.getByText("Симонов Степан")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5
});

test("empty=1 shows cancelled empty copy", () => {
  renderBookings("/bookings?tab=cancelled&empty=1");
  expect(screen.getByRole("heading", { name: "Нет бронирований" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "Отменённые вами или пользователями бронирования появятся здесь!",
    ),
  ).toBeInTheDocument();
});

test("search without matches shows empty state", async () => {
  const user = userEvent.setup();
  renderBookings("/bookings?tab=cancelled");
  await user.type(
    screen.getByLabelText("Введите имя или номер гостя"),
    "неттакогогостя",
  );
  expect(screen.getByRole("heading", { name: "Нет бронирований" })).toBeInTheDocument();
});

test("default tab is requests table", () => {
  renderBookings("/bookings");
  expect(screen.getAllByRole("button", { name: "Принять" }).length).toBeGreaterThan(0);
  expect(screen.queryByRole("heading", { name: "Нет заявок" })).not.toBeInTheDocument();
});
