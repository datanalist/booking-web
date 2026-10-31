import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { createApi } from "../../api";
import { SESSION_KEY } from "../../api/keys";
import { SUPPORT_STAFF_USER_ID } from "../chat";
import { SessionProvider } from "../../app/session";
import { ProfilePage } from "./ProfilePage";

beforeEach(async () => {
  localStorage.clear();
  const api = createApi(localStorage);
  await api.auth.register("hello@gmail.com", "secret12");
  await api.auth.login("hello@gmail.com", "secret12");
  await api.auth.completeOnboarding({
    name: "Анна Иваненко",
    phone: "+7 (900) 123-45-67",
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderProfile(): void {
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chats" element={<ChatsProbe />} />
          <Route path="/login" element={<div>login-page</div>} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

test("renders personal data, api key and balance cards", () => {
  renderProfile();

  expect(screen.getByLabelText("Имя")).toHaveValue("Анна Иваненко");
  expect(screen.getByLabelText("Номер телефона")).toHaveValue(
    "+7 (900) 123-45-67",
  );
  expect(screen.getByLabelText("Email:")).toHaveValue("hello@gmail.com");
  expect(screen.getByText("API Key TravelLine")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByText("Доступный баланс")).toBeInTheDocument();
  expect(screen.getByText(/0\s₽/)).toBeInTheDocument();
  expect(document.querySelector("[data-dialog]")).toBeNull();
});

test("пополнение открывает форму и без сессии PocketBase показывает ошибку", async () => {
  const user = userEvent.setup();
  renderProfile();

  await user.click(screen.getByRole("button", { name: "Пополнить баланс" }));
  const dialog = screen.getByRole("dialog", { name: "Пополнение баланса" });
  await user.type(within(dialog).getByLabelText("Сумма, ₽"), "100");
  await user.click(within(dialog).getByRole("button", { name: "Пополнить" }));

  expect(await within(dialog).findByRole("alert")).toHaveTextContent("Войдите в аккаунт");
  expect(screen.getByText(/0\s₽/)).toBeInTheDocument();
});

test("opens and closes the edit and logout alerts", async () => {
  const user = userEvent.setup();
  renderProfile();

  await user.click(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  );
  const editDialog = screen.getByRole("dialog", {
    name: "Редактировать данные профиля",
  });
  expect(editDialog).toBeInTheDocument();
  await user.click(within(editDialog).getByRole("button", { name: "Закрыть" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));
  const logoutDialog = screen.getByRole("dialog", {
    name: "Выйти из аккаунта?",
  });
  expect(logoutDialog).toBeInTheDocument();
  await user.click(
    within(logoutDialog).getByRole("button", { name: "Вернуться" }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("confirm logout clears the session and opens login", async () => {
  const user = userEvent.setup();
  renderProfile();

  await user.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));
  await user.click(screen.getByRole("button", { name: "Да, выйти" }));

  expect(await screen.findByText("login-page")).toBeInTheDocument();
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});

test("connecting a key shows connected or error", async () => {
  const user = userEvent.setup();
  renderProfile();
  const field = screen.getByLabelText("API Key");

  await user.type(field, "12345");
  await user.click(screen.getByRole("button", { name: "Подключить" }));
  expect(screen.getByRole("status")).toHaveTextContent("Ошибка подключения");

  await user.clear(field);
  await user.type(field, "123456");
  await user.click(screen.getByRole("button", { name: "Подключить" }));
  expect(screen.getByRole("status")).toHaveTextContent("Подключено");
});

test("saving the edit alert updates the personal card", async () => {
  const user = userEvent.setup();
  renderProfile();

  await user.click(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  );
  const dialog = screen.getByRole("dialog", {
    name: "Редактировать данные профиля",
  });
  const name = within(dialog).getByLabelText("Имя");
  await user.clear(name);
  await user.type(name, "Мария Петрова");
  await user.click(screen.getByRole("button", { name: "Сохранить" }));

  expect(await screen.findByDisplayValue("Мария Петрова")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("занятый email оставляет алерт открытым и показывает ошибку", async () => {
  const api = createApi(localStorage);
  await api.auth.register("other@mail.ru", "secret12");
  await api.auth.login("hello@gmail.com", "secret12");
  const user = userEvent.setup();
  renderProfile();

  await user.click(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  );
  const dialog = screen.getByRole("dialog", {
    name: "Редактировать данные профиля",
  });
  const email = within(dialog).getByLabelText("Email");
  await user.clear(email);
  await user.type(email, "other@mail.ru");
  await user.click(screen.getByRole("button", { name: "Сохранить" }));

  expect(
    await within(dialog).findByText("Такой email уже зарегистрирован"),
  ).toBeInTheDocument();
  expect(dialog).toBeInTheDocument();
  expect(screen.getByLabelText("Email:")).toHaveValue("hello@gmail.com");
});

test("support button opens the chats route", async () => {
  const user = userEvent.setup();
  renderProfile();
  await user.click(
    screen.getByRole("button", { name: "Написать в поддержку" }),
  );
  expect(await screen.findByText("chats-page:chat-support")).toBeInTheDocument();
});

test("при pocketbase кнопка открывает найденный чат и не создаёт второй", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  const userId = sessionUserId();
  const calls: { method: string; url: string; body: string }[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      method: init?.method ?? "GET",
      url: String(input),
      body: typeof init?.body === "string" ? init.body : "",
    });
    return listResponse([{
      id: "gc134dxdyo7je7w",
      kind: "support",
      host: userId,
      guest: SUPPORT_STAFF_USER_ID,
    }]);
  });
  try {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Написать в поддержку" }));
    expect(await screen.findByText("chats-page:gc134dxdyo7je7w")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
    expect(decodeURIComponent(calls[0]?.url ?? "")).toContain(`host="${userId}"`);
    expect(decodeURIComponent(calls[0]?.url ?? "")).toContain('kind="support"');
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

test("при pocketbase без чата кнопка создаёт поддержку и открывает её", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  const userId = sessionUserId();
  const calls: { method: string; body: string }[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({
      method,
      body: typeof init?.body === "string" ? init.body : "",
    });
    if (method === "POST") {
      return new Response(JSON.stringify({
        id: "newsupport00001",
        kind: "support",
        guest: userId,
        host: userId,
        staff: SUPPORT_STAFF_USER_ID,
      }), { status: 200 });
    }
    return listResponse([]);
  });
  try {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Написать в поддержку" }));
    expect(await screen.findByText("chats-page:newsupport00001")).toBeInTheDocument();
    const created = calls.find((call) => call.method === "POST");
    expect(JSON.parse(created?.body ?? "{}")).toEqual({
      kind: "support",
      guest: userId,
      host: userId,
      staff: SUPPORT_STAFF_USER_ID,
    });
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

function sessionUserId(): string {
  const raw = localStorage.getItem(SESSION_KEY);
  const parsed: unknown = raw === null ? null : JSON.parse(raw);
  if (
    typeof parsed !== "object"
    || parsed === null
    || !("userId" in parsed)
    || typeof parsed.userId !== "string"
  ) {
    throw new Error("нет сессии");
  }
  return parsed.userId;
}

function listResponse(items: readonly unknown[]): Response {
  return new Response(JSON.stringify({
    page: 1,
    perPage: 1,
    totalItems: items.length,
    totalPages: items.length === 0 ? 0 : 1,
    items,
  }), { status: 200 });
}

function ChatsProbe() {
  const [params] = useSearchParams();
  return <div>chats-page:{params.get("chat")}</div>;
}
