import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { SESSION_KEY } from "../../../api/keys";
import { NotificationsPage } from "./NotificationsPage";

const unreadRecord = {
  id: "unread-1",
  user: "user1",
  title: "Новое сообщение от Екатерины Кондратьевой",
  body: "Добрый день, возможно ли раннее заселение?",
  read: false,
  created: "2026-10-24 12:00:00",
  updated: "2026-10-24 12:00:00",
};

const readRecord = {
  id: "read-1",
  user: "user1",
  title: "Объявление опубликовано",
  body: "Ваше объявление успешно прошло модерацию",
  read: true,
  created: "2024-09-07 12:00:00",
  updated: "2024-09-07 12:00:00",
};

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  localStorage.removeItem(SESSION_KEY);
});

function stubNotifications(items: readonly unknown[]): void {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: "user1", onboardingComplete: true }));
  vi.stubGlobal("fetch", async () =>
    new Response(JSON.stringify({
      page: 1,
      perPage: 200,
      totalItems: items.length,
      totalPages: 1,
      items,
    }), { status: 200 }),
  );
}

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

test("непрочитанные сами попадают на вкладку и сохраняют точку", async () => {
  stubNotifications([readRecord, unreadRecord]);
  render(
    <MemoryRouter initialEntries={["/notifications?tab=unread"]}>
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByRole("heading", { name: unreadRecord.title })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: readRecord.title })).not.toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Не прочитанные" })).toHaveAttribute("aria-selected", "true");
  const pin = document.querySelector("img[src='/notifications-unread-pin.svg']");
  expect(pin).not.toBeNull();
});

test("пустая вкладка непрочитанных показывает подпись кадра 1:18319", async () => {
  stubNotifications([readRecord]);
  render(
    <MemoryRouter initialEntries={["/notifications?tab=unread"]}>
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByRole("heading", { name: "Нет уведомлений" })).toBeInTheDocument();
  expect(screen.getByText("Все уведомления прочитаны")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Не прочитанные" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByTestId("notifications-empty-art")).toBeInTheDocument();
});

test("прочитанные на своей вкладке без точки", async () => {
  stubNotifications([readRecord, unreadRecord]);
  render(
    <MemoryRouter initialEntries={["/notifications?tab=read"]}>
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByRole("heading", { name: readRecord.title })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: unreadRecord.title })).not.toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Прочитанные" })).toHaveAttribute("aria-selected", "true");
  expect(document.querySelector("img[src='/notifications-unread-pin.svg']")).toBeNull();
});

test("пустая вкладка прочитанных повторяет каркас без чужой подписи", async () => {
  stubNotifications([unreadRecord]);
  render(
    <MemoryRouter initialEntries={["/notifications?tab=read"]}>
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByRole("heading", { name: "Нет уведомлений" })).toBeInTheDocument();
  expect(screen.queryByText("Все уведомления прочитаны")).not.toBeInTheDocument();
  expect(screen.queryByText("Уведомления об объявлениях и бронированиях появятся здесь")).not.toBeInTheDocument();
  expect(screen.getByTestId("notifications-empty-art")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Прочитанные" })).toHaveAttribute("aria-selected", "true");
});
