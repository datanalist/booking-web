import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, test } from "vitest";
import { NotificationsPage } from "./NotificationsPage";

afterEach(() => {
  cleanup();
});

function renderPage(): void {
  render(
    <MemoryRouter initialEntries={["/notifications"]}>
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

test("пустой ящик показывает иллюстрацию макета и не показывает вкладки", () => {
  renderPage();
  expect(screen.getByRole("heading", { level: 1, name: "Уведомления" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Нет уведомлений" })).toBeInTheDocument();
  expect(
    screen.getByText("Уведомления об объявлениях и бронированиях появятся здесь"),
  ).toBeInTheDocument();
  expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  const art = screen.getByTestId("notifications-empty-art");
  expect(art).toHaveAttribute("src", "/notifications-empty.svg");
  expect(art).toHaveAttribute("width", "228.846");
  expect(art).toHaveAttribute("height", "200");
});

test("без VITE_DATA_SOURCE=pocketbase нет фиктивного «Новое сообщение»", () => {
  renderPage();
  expect(screen.queryByRole("heading", { name: "Новое сообщение" })).not.toBeInTheDocument();
  expect(screen.queryByText("Новое сообщение")).not.toBeInTheDocument();
});
