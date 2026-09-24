import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test } from "vitest";
import { createApi } from "../api";
import { SESSION_KEY } from "../api/keys";
import { SessionProvider } from "../app/session";
import { RegisterPage } from "./RegisterPage";

function renderRegister(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <SessionProvider>
        <RegisterPage />
      </SessionProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

test("shows Figma registration copy and auth fields", () => {
  renderRegister();

  expect(
    screen.getByRole("heading", { name: "Регистрация" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
  expect(screen.getByLabelText("Повторите пароль")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Введите email")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Введите пароль")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Повторите пароль")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Зарегистрироваться" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Есть аккаунт?")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Войти" })).toHaveAttribute(
    "href",
    "/login",
  );
  expect(screen.queryByText(/Уже есть аккаунт/i)).toBeNull();
  expect(screen.queryByText("Создать аккаунт")).toBeNull();
  expect(screen.queryByText("Подтвердите пароль")).toBeNull();
  expect(screen.queryByText(/Продолжая, Вы соглашаетесь/i)).toBeNull();
});

test("password fields expose passwordToggle controls", () => {
  renderRegister();

  const toggles = screen.getAllByRole("button", {
    name: /показать пароль|скрыть пароль/i,
  });
  expect(toggles).toHaveLength(2);
});

test("submit button overrides radius to 8px", () => {
  renderRegister();

  const submit = screen.getByRole("button", { name: "Зарегистрироваться" });
  expect(submit.className).toMatch(/rounded-\[8px\]|!rounded-\[8px\]/);
});

test("password mismatch shows field error without failure banner", async () => {
  const user = userEvent.setup();
  renderRegister();

  await user.type(screen.getByLabelText("Email"), "hello@gmail.com");
  await user.type(screen.getByLabelText("Пароль"), "pass123456");
  await user.type(screen.getByLabelText("Повторите пароль"), "otherpass1");
  await user.click(
    screen.getByRole("button", { name: "Зарегистрироваться" }),
  );

  expect(screen.getByText("Пароли не совпадают")).toBeInTheDocument();
  expect(
    screen.queryByText(
      "Не получилось зарегистрироваться, попробуйте еще раз",
    ),
  ).toBeNull();
  expect(
    document.querySelector('img[src="/icon-info-circle.svg"]'),
  ).toBeNull();
});

test("EMAIL_TAKEN shows failure banner like Figma 1:16424", async () => {
  const user = userEvent.setup();
  const api = createApi(localStorage);
  await api.auth.register("hello@gmail.com", "pass123456");
  localStorage.removeItem(SESSION_KEY);

  renderRegister();

  await user.type(screen.getByLabelText("Email"), "hello@gmail.com");
  await user.type(screen.getByLabelText("Пароль"), "pass123456");
  await user.type(screen.getByLabelText("Повторите пароль"), "pass123456");
  await user.click(
    screen.getByRole("button", { name: "Зарегистрироваться" }),
  );

  expect(
    await screen.findByText(
      "Не получилось зарегистрироваться, попробуйте еще раз",
    ),
  ).toBeInTheDocument();
  expect(
    document.querySelector('img[src="/icon-info-circle.svg"]'),
  ).not.toBeNull();
  expect(screen.queryByText(/уже зарегистрирован/i)).toBeNull();
});
