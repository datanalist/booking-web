import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "../app/session";
import { LoginPage } from "./LoginPage";

afterEach(() => {
  cleanup();
});

function renderLogin(initialEntry = "/login"): void {
  render(
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

test("verified=1 показывает подтверждение почты отдельно от ошибки", () => {
  renderLogin("/login?verified=1");
  expect(
    screen.getByText("Почта подтверждена. Войдите, чтобы продолжить."),
  ).toBeInTheDocument();
  expect(screen.queryByText("Неверный email или пароль")).toBeNull();
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
