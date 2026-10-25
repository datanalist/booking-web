import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { SESSION_KEY } from "../../../api/keys";
import { SessionProvider } from "../../../app/session";
import { CabinetLayout } from "../../../pages/CabinetLayout";
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

test("клик по непрочитанной карточке помечает запись read и уменьшает бейдж", async () => {
  const patches: { url: string; body: string }[] = [];
  const records = [{ ...readRecord }, { ...unreadRecord }];
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    userId: "user1",
    email: "hello@gmail.com",
    name: "Ирина Иванова",
    phone: "+70000000000",
    onboardingComplete: true,
  }));
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method === "PATCH") {
      const body = typeof init?.body === "string" ? init.body : "";
      patches.push({ url: String(input), body });
      const id = String(input).split("/").pop()?.split("?")[0];
      const index = records.findIndex((item) => item.id === id);
      if (index >= 0) {
        records[index] = { ...records[index], read: true };
      }
      return new Response(JSON.stringify(records[index] ?? null), { status: 200 });
    }
    return new Response(JSON.stringify({
      page: 1,
      perPage: 200,
      totalItems: records.length,
      totalPages: 1,
      items: records,
    }), { status: 200 });
  });

  const user = userEvent.setup();
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/notifications?tab=unread"]}>
        <Routes>
          <Route
            path="/notifications"
            element={(
              <CabinetLayout>
                <NotificationsPage />
              </CabinetLayout>
            )}
          />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );

  const link = screen.getByRole("link", { name: /уведомления/i });
  expect(await within(link).findByText("1")).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: unreadRecord.title })).toBeInTheDocument();
  expect(document.querySelector("img[src='/notifications-unread-pin.svg']")).not.toBeNull();

  await user.click(screen.getByRole("heading", { name: unreadRecord.title }));

  await waitFor(() => {
    expect(screen.queryByRole("heading", { name: unreadRecord.title })).not.toBeInTheDocument();
  });
  expect(within(link).queryByText("1")).not.toBeInTheDocument();
  expect(patches).toHaveLength(1);
  expect(patches[0]?.url).toContain(`/api/collections/notifications/records/${unreadRecord.id}`);
  expect(JSON.parse(patches[0]?.body ?? "{}")).toEqual({ read: true });

  await user.click(screen.getByRole("tab", { name: "Прочитанные" }));
  expect(screen.getByRole("heading", { name: unreadRecord.title })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: readRecord.title })).toBeInTheDocument();
  expect(document.querySelector("img[src='/notifications-unread-pin.svg']")).toBeNull();

  await user.click(screen.getByRole("heading", { name: unreadRecord.title }));
  await user.click(screen.getByRole("heading", { name: readRecord.title }));
  expect(patches).toHaveLength(1);
});
