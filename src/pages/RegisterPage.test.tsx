import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createApi } from "../api";
import { SESSION_KEY } from "../api/keys";
import { SessionProvider } from "../app/session";
import { RegisterPage } from "./RegisterPage";

const MAIL_SEND_FAILURE_MESSAGE =
  "Не удалось отправить письмо. Попробуйте ещё раз";

const authDouble = vi.hoisted(() => ({
  register: null as
    | ((email: string, password: string) => Promise<{ email: string }>)
    | null,
}));

vi.mock("../app/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../app/session")>();
  return {
    ...actual,
    useSession() {
      const value = actual.useSession();
      if (authDouble.register === null) return value;
      return {
        ...value,
        auth: {
          ...value.auth,
          register: authDouble.register,
        },
      };
    },
  };
});

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
  authDouble.register = null;
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

test("email and password fields share auth width and height classes", () => {
  renderRegister();

  const email = screen.getByLabelText("Email");
  const password = screen.getByLabelText("Пароль");
  const confirm = screen.getByLabelText("Повторите пароль");

  for (const field of [email, password, confirm]) {
    expect(field.className).toMatch(/\bw-full\b/);
    expect(field.className).toMatch(/h-\[44px]/);
  }

  expect(password.className).toMatch(/\bpr-11\b/);
  expect(confirm.className).toMatch(/\bpr-11\b/);
  expect(email.className).not.toMatch(/\bpr-11\b/);

  const emailRoot = email.closest("div.flex.w-full");
  const passwordRoot = password.closest("div.flex.w-full");
  const confirmRoot = confirm.closest("div.flex.w-full");
  expect(emailRoot).not.toBeNull();
  expect(passwordRoot).not.toBeNull();
  expect(confirmRoot).not.toBeNull();
});

test("submit button overrides radius to 8px", () => {
  renderRegister();

  const submit = screen.getByRole("button", { name: "Зарегистрироваться" });
  expect(submit.className).toMatch(/rounded-\[8px\]|!rounded-\[8px\]/);
});

test("без галочки регистрация не уходит", async () => {
  const user = userEvent.setup();
  renderRegister();
  await user.type(screen.getByLabelText("Email"), "hello@gmail.com");
  await user.type(screen.getByLabelText("Пароль"), "pass123456");
  await user.type(screen.getByLabelText("Повторите пароль"), "pass123456");
  const submit = screen.getByRole("button", { name: "Зарегистрироваться" });
  expect(submit).toBeDisabled();
  expect(screen.getByRole("link", { name: "Условиями использования" })).toHaveAttribute("href", "/terms");
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});

test("password mismatch shows field error without failure banner", async () => {
  const user = userEvent.setup();
  renderRegister();

  await user.type(screen.getByLabelText("Email"), "hello@gmail.com");
  await user.type(screen.getByLabelText("Пароль"), "pass123456");
  await user.type(screen.getByLabelText("Повторите пароль"), "otherpass1");
  await user.click(screen.getByRole("checkbox"));
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

test("после согласия показывает письмо и не открывает сессию", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <SessionProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<div>onboarding-page</div>} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );

  await user.type(screen.getByLabelText("Email"), "hello@gmail.com");
  await user.type(screen.getByLabelText("Пароль"), "pass123456");
  await user.type(screen.getByLabelText("Повторите пароль"), "pass123456");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

  expect(
    await screen.findByText(
      "Письмо отправлено на hello@gmail.com. Подтвердите почту по кнопке в письме. Войти можно после подтверждения.",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText("onboarding-page")).toBeNull();
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
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
  await user.click(screen.getByRole("checkbox"));
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

test("сбой отправки письма показывает эту фразу", async () => {
  const user = userEvent.setup();
  authDouble.register = () => Promise.reject(new Error(MAIL_SEND_FAILURE_MESSAGE));
  renderRegister();

  await user.type(screen.getByLabelText("Email"), "hello@gmail.com");
  await user.type(screen.getByLabelText("Пароль"), "pass123456");
  await user.type(screen.getByLabelText("Повторите пароль"), "pass123456");
  await user.click(screen.getByRole("checkbox"));
  await user.click(
    screen.getByRole("button", { name: "Зарегистрироваться" }),
  );

  expect(await screen.findByText(MAIL_SEND_FAILURE_MESSAGE)).toBeInTheDocument();
  expect(
    screen.queryByText(
      "Не получилось зарегистрироваться, попробуйте еще раз",
    ),
  ).toBeNull();
});

test("повторный сбой убирает текст об отправленном письме", async () => {
  const user = userEvent.setup();
  let attempt = 0;
  authDouble.register = (email) => {
    attempt += 1;
    if (attempt === 1) return Promise.resolve({ email: email.trim().toLowerCase() });
    return Promise.reject(new Error("почта занята"));
  };
  renderRegister();

  await user.type(screen.getByLabelText("Email"), "hello@gmail.com");
  await user.type(screen.getByLabelText("Пароль"), "pass123456");
  await user.type(screen.getByLabelText("Повторите пароль"), "pass123456");
  await user.click(screen.getByRole("checkbox"));
  const submit = screen.getByRole("button", { name: "Зарегистрироваться" });
  await user.click(submit);

  expect(
    await screen.findByText(
      "Письмо отправлено на hello@gmail.com. Подтвердите почту по кнопке в письме. Войти можно после подтверждения.",
    ),
  ).toBeInTheDocument();

  await user.click(submit);

  expect(
    await screen.findByText(
      "Не получилось зарегистрироваться, попробуйте еще раз",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Письмо отправлено/)).toBeNull();
});
