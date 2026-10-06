import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { createApi } from "../../api";
import { SESSION_KEY } from "../../api/keys";
import { SessionProvider } from "../../app/session";
import { ProfilePage } from "./ProfilePage";

beforeEach(async () => {
  localStorage.clear();
  const api = createApi(localStorage);
  await api.auth.register("hello@gmail.com", "secret12");
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
  expect(screen.getByText(/34\s670\s₽/)).toBeInTheDocument();
  expect(document.querySelector("[data-dialog]")).toBeNull();
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

function ChatsProbe() {
  const [params] = useSearchParams();
  return <div>chats-page:{params.get("chat")}</div>;
}
