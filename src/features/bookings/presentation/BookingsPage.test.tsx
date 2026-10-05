import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, test } from "vitest";
import { BookingsPage } from "./BookingsPage";

afterEach(() => {
  cleanup();
});

function renderBookings(path = "/bookings"): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/bookings" element={<BookingsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

test("shows mock requests table by default", () => {
  renderBookings();
  expect(screen.getByRole("heading", { name: "Бронирования" })).toBeInTheDocument();
  expect(screen.getByText("Иваненко Анна")).toBeInTheDocument();
  expect(screen.getByText("Ковалев Леонид")).toBeInTheDocument();
  expect(screen.getByText("Полякова Кристина")).toBeInTheDocument();
  expect(screen.getByText("15 460 ₽")).toBeInTheDocument();
});

test("empty query param shows requests empty state", () => {
  renderBookings("/bookings?empty=1");
  expect(screen.getByRole("heading", { name: "Нет заявок" })).toBeInTheDocument();
  expect(
    screen.getByText("Заявки на бронирование жилья появятся здесь!"),
  ).toBeInTheDocument();
});

test("search filters by guest name case-insensitively", async () => {
  const user = userEvent.setup();
  renderBookings();
  await user.type(
    screen.getByPlaceholderText("Введите имя или номер гостя"),
    "иваненко",
  );
  expect(screen.getByText("Иваненко Анна")).toBeInTheDocument();
  expect(screen.queryByText("Ковалев Леонид")).not.toBeInTheDocument();
});

test("accept opens modal and removes request", async () => {
  const user = userEvent.setup();
  renderBookings();
  const row = screen.getByText("Иваненко Анна").closest("tr");
  expect(row).not.toBeNull();
  await user.click(within(row as HTMLElement).getByRole("button", { name: "Принять" }));
  expect(screen.getByRole("heading", { name: "Заявка принята" })).toBeInTheDocument();
  expect(screen.queryByText("Иваненко Анна")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Ок" }));
  expect(screen.queryByRole("heading", { name: "Заявка принята" })).not.toBeInTheDocument();
});

test("reject modal counter and cancel keep request", async () => {
  const user = userEvent.setup();
  renderBookings();
  const row = screen.getByText("Ковалев Леонид").closest("tr");
  expect(row).not.toBeNull();
  await user.click(within(row as HTMLElement).getByRole("button", { name: "Отклонить" }));
  expect(screen.getByRole("heading", { name: "Отклонить заявку" })).toBeInTheDocument();
  expect(screen.getByText("0/500")).toBeInTheDocument();
  await user.type(screen.getByPlaceholderText("Укажите причину отказа"), "занято");
  expect(screen.getByText("6/500")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  expect(screen.getByText("Ковалев Леонид")).toBeInTheDocument();
});

test("reject submit removes request", async () => {
  const user = userEvent.setup();
  renderBookings();
  const row = screen.getByText("Полякова Кристина").closest("tr");
  expect(row).not.toBeNull();
  await user.click(within(row as HTMLElement).getByRole("button", { name: "Отклонить" }));
  await user.click(screen.getByRole("button", { name: "Отправить" }));
  expect(screen.queryByText("Полякова Кристина")).not.toBeInTheDocument();
});

test("confirmed tab shows status table", async () => {
  const user = userEvent.setup();
  renderBookings();
  await user.click(screen.getByRole("tab", { name: "Подтверждены" }));
  expect(screen.getByText("Ожидание предоплаты")).toBeInTheDocument();
  expect(screen.getByText("Предоплата внесена")).toBeInTheDocument();
  expect(screen.getByText("Аренда завершилась")).toBeInTheDocument();
  expect(screen.getByText("Проживание")).toBeInTheDocument();
});

test("rejected tab shows table without accept buttons", async () => {
  const user = userEvent.setup();
  renderBookings();
  await user.click(screen.getByRole("tab", { name: "Отклонены" }));
  expect(
    screen.getByRole("table", { name: "Отклонённые бронирования" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Принять" })).not.toBeInTheDocument();
});

test("cancelled tab shows table without action buttons", async () => {
  const user = userEvent.setup();
  renderBookings();
  await user.click(screen.getByRole("tab", { name: "Отменены" }));
  expect(screen.getByText("Симонов Степан")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Принять" })).not.toBeInTheDocument();
});
