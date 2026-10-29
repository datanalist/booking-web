import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "../app/session";
import { LoginPage } from "./LoginPage";
import { EMAIL_VERIFIED_NOTICE_KEY } from "./emailVerifiedNoticeChannel";

afterEach(() => {
  cleanup();
});

function renderLogin(initialEntry = "/login") {
  return render(
    <SessionProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<div>register-page</div>} />
          <Route path="/forgot-password" element={<div>forgot-page</div>} />
          <Route path="/listings" element={<div>listings-page</div>} />
          <Route path="/onboarding" element={<div>onboarding-page</div>} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

test("title is centered and fields use auth variant", () => {
  renderLogin();
  const title = screen.getByRole("heading", { name: "Войти" });
  expect(title.className).toMatch(/text-center/);
  const email = screen.getByPlaceholderText("Введите email");
  expect(email.className).toMatch(/251,\s*192,\s*40|fbc028/i);
  expect(
    screen.getByRole("button", { name: /показать пароль|скрыть пароль/i }),
  ).toBeInTheDocument();
});

test("forgot password opens modal without leaving login", async () => {
  const user = userEvent.setup();
  renderLogin();
  await user.click(screen.getByRole("button", { name: "Забыли пароль?" }));
  expect(
    screen.getByRole("heading", { name: "Забыли пароль?" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("forgot-page")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Войти" })).toBeInTheDocument();
});

test("invalid credentials mark both fields and show error text", async () => {
  const user = userEvent.setup();
  renderLogin();
  await user.type(screen.getByPlaceholderText("Введите email"), "a@mail.ru");
  await user.type(screen.getByPlaceholderText("Введите пароль"), "wrongpass");
  await user.click(screen.getByRole("button", { name: "Начать работу" }));
  expect(
    await screen.findByText("Неверный email или пароль"),
  ).toBeInTheDocument();
  const email = screen.getByPlaceholderText("Введите email");
  const password = screen.getByPlaceholderText("Введите пароль");
  expect(email.className).toMatch(/e34043|#e34043/);
  expect(password.className).toMatch(/e34043|#e34043/);
});

test("opens forgot modal when arriving with state.forgot", () => {
  render(
    <SessionProvider>
      <MemoryRouter
        initialEntries={[{ pathname: "/login", state: { forgot: true } }]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
  expect(
    screen.getByRole("heading", { name: "Забыли пароль?" }),
  ).toBeInTheDocument();
});

test("submit button uses rounded-lg padding and footer is centered", () => {
  renderLogin();
  const submit = screen.getByRole("button", { name: "Начать работу" });
  expect(submit.className).toMatch(/rounded-lg|!rounded-lg|rounded-\[8px\]|!rounded-\[8px\]/);
  expect(submit.className).toMatch(/!px-6|px-6/);
  expect(submit.className).toMatch(/!py-5|py-5/);
  expect(submit.className).toMatch(/\bw-full\b/);
  const footer = screen.getByText(/Нет аккаунта\?/).closest("p");
  expect(footer?.className).toMatch(/text-center/);
});

test("login form uses Figma gaps between title, fields and button", () => {
  renderLogin();
  const form = screen.getByRole("heading", { name: "Войти" }).closest("form");
  expect(form?.className).toMatch(/\bgap-10\b/);
  expect(form?.className).toMatch(/\bitems-center\b/);
  const fields = form?.querySelector(".gap-5");
  expect(fields).not.toBeNull();
  const passwordGroup = screen
    .getByRole("button", { name: "Забыли пароль?" })
    .closest("div");
  expect(passwordGroup?.className).toMatch(/\bgap-2\b/);
  const actions = screen
    .getByRole("button", { name: "Начать работу" })
    .closest("div");
  expect(actions?.className).toMatch(/\bgap-6\b/);
});

test("does not render local disclaimer inside login form", () => {
  renderLogin();
  const form = screen.getByRole("heading", { name: "Войти" }).closest("form");
  expect(form).not.toBeNull();
  expect(
    within(form as HTMLElement).queryByText(/Продолжая, Вы соглашаетесь/),
  ).not.toBeInTheDocument();
});

test("verified=1 не подменяет уже открытую форму входа", () => {
  renderLogin("/login?verified=1");
  expect(screen.getByRole("heading", { name: "Войти" })).toBeInTheDocument();
  expect(screen.queryByText("Пожалуйста, вернитесь на страницу входа.")).toBeNull();
});

test("уже открытый вход обновляется, когда почта подтверждена в другой вкладке", async () => {
  renderLogin();
  window.dispatchEvent(
    new StorageEvent("storage", { key: EMAIL_VERIFIED_NOTICE_KEY }),
  );
  expect(
    await screen.findByText("Почта подтверждена. Войдите, чтобы продолжить."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Начать работу" })).toBeInTheDocument();
  const note = screen.getByText("Почта подтверждена. Войдите, чтобы продолжить.").parentElement;
  expect(note?.className).toMatch(/rounded-\[12px\]/);
  expect(note?.className).toMatch(/bg-white/);
  expect(note?.className).toMatch(/border-\[var\(--color-accent\)\]/);
});

test("при PocketBase кнопка Telegram открывает окно входа и показывает отмену", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  vi.stubEnv("VITE_TELEGRAM_BOT_ID", "9158776426");
  const user = userEvent.setup();
  const popup = { closed: false, close: vi.fn(), location: { href: "" } };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ nonce: "nonce-1" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })),
  );
  const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
  try {
    renderLogin();
    expect(screen.getByText("или войдите с помощью")).toBeInTheDocument();
    const telegram = screen.getByRole("button", { name: "Войти через Telegram" });
    expect(telegram.className).toMatch(/rounded-\[12px\]/);
    expect(telegram.className).toMatch(/2AABEE/);
    expect(telegram.querySelector("svg")).not.toBeNull();
    await user.click(telegram);
    expect(open).toHaveBeenCalled();
    await waitFor(() => {
      expect(popup.location.href).toContain("response_type=post_message");
      expect(popup.location.href).toContain("client_id=9158776426");
      expect(popup.location.href).toContain("redirect_uri=https%3A%2F%2Fapp.booking.vallome.ru%2F");
      expect(popup.location.href).toContain("scope=openid+profile");
      expect(popup.location.href).not.toContain("phone");
    });
    popup.closed = true;
    expect(await screen.findByText("Вход через Telegram отменён")).toBeInTheDocument();
  } finally {
    open.mockRestore();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
});

function installTelegramLogin(): {
  popup: { closed: boolean; close: ReturnType<typeof vi.fn>; location: { href: string } };
  calls: { url: string; body: string }[];
  restore: () => void;
} {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  vi.stubEnv("VITE_TELEGRAM_BOT_ID", "9158776426");
  vi.stubEnv("VITE_POCKETBASE_URL", "https://pb.example");
  const popup = { closed: false, close: vi.fn(), location: { href: "" } };
  const calls: { url: string; body: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const body = typeof init?.body === "string" ? init.body : "";
      calls.push({ url, body });
      if (url.includes("/api/vallome/telegram-nonce")) {
        return new Response(JSON.stringify({ nonce: "nonce-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.includes("/api/vallome/telegram-auth")) {
        return new Response(JSON.stringify({
          token: "tg-token",
          record: { id: "user1", email: "", name: "", phone: "" },
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    }),
  );
  const open = vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
  return {
    popup,
    calls,
    restore(): void {
      open.mockRestore();
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      localStorage.clear();
    },
  };
}

function postTelegramAuth(popup: object, idToken: string): void {
  window.dispatchEvent(new MessageEvent("message", {
    origin: "https://oauth.telegram.org",
    data: { event: "auth_result", result: idToken },
    source: popup as unknown as Window,
  }));
}

test("postMessage от Telegram входит с id_token и nonce", async () => {
  const user = userEvent.setup();
  const telegram = installTelegramLogin();
  try {
    renderLogin();
    await user.click(screen.getByRole("button", { name: "Войти через Telegram" }));
    await waitFor(() => {
      expect(telegram.popup.location.href).toContain("nonce=nonce-1");
    });
    postTelegramAuth(telegram.popup, "telegram-id-token");
    await waitFor(() => {
      const authCall = telegram.calls.find((call) => call.url.includes("/api/vallome/telegram-auth"));
      expect(JSON.parse(authCall?.body ?? "{}")).toEqual({
        id_token: "telegram-id-token",
        nonce: "nonce-1",
      });
    });
    expect(await screen.findByText("onboarding-page")).toBeInTheDocument();
  } finally {
    telegram.restore();
  }
});

test("уход со входа снимает слушатель Telegram и интервал", async () => {
  const user = userEvent.setup();
  const telegram = installTelegramLogin();
  const addSpy = vi.spyOn(window, "addEventListener");
  const removeSpy = vi.spyOn(window, "removeEventListener");
  const setIntervalSpy = vi.spyOn(window, "setInterval");
  const clearIntervalSpy = vi.spyOn(window, "clearInterval");
  try {
    renderLogin();
    await user.click(screen.getByRole("button", { name: "Войти через Telegram" }));
    await waitFor(() => {
      expect(telegram.popup.location.href).toContain("nonce=nonce-1");
    });
    const messageListener = addSpy.mock.calls.find((call) => call[0] === "message")?.[1];
    const intervalCall = setIntervalSpy.mock.calls.findIndex((call) => call[1] === 400);
    const intervalId = setIntervalSpy.mock.results[intervalCall]?.value;
    expect(messageListener).toEqual(expect.any(Function));
    await user.click(screen.getByRole("link", { name: /Создать аккаунт/ }));
    expect(screen.getByText("register-page")).toBeInTheDocument();
    expect(removeSpy).toHaveBeenCalledWith("message", messageListener);
    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    postTelegramAuth(telegram.popup, "telegram-id-token");
    expect(telegram.calls.some((call) => call.url.includes("/api/vallome/telegram-auth"))).toBe(false);
    expect(screen.queryByText("onboarding-page")).not.toBeInTheDocument();
  } finally {
    addSpy.mockRestore();
    removeSpy.mockRestore();
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    telegram.restore();
  }
});

test("email and password fields share auth size", () => {
  renderLogin();
  const email = screen.getByPlaceholderText("Введите email");
  const password = screen.getByPlaceholderText("Введите пароль");
  expect(email.className).toMatch(/\bw-full\b/);
  expect(password.className).toMatch(/\bw-full\b/);
  expect(email.className).toMatch(/h-\[44px\]/);
  expect(password.className).toMatch(/h-\[44px\]/);
  const emailWrap = email.parentElement;
  const passwordWrap = password.parentElement;
  expect(emailWrap?.className).toMatch(/\bw-full\b/);
  expect(passwordWrap?.className).toMatch(/\bw-full\b/);
  const forgot = screen.getByRole("button", { name: "Забыли пароль?" });
  expect(forgot.className).toMatch(/\bw-full\b/);
  expect(forgot.className).toMatch(/text-right/);
});
