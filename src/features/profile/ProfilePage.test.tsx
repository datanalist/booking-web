import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createApi } from "../../api";
import { SessionProvider } from "../../app/session";
import { ProfilePage } from "./ProfilePage";

beforeEach(async () => {
  localStorage.clear();
  const api = createApi(localStorage);
  const session = await api.auth.register("hello@gmail.com", "secret12");
  await api.auth.completeOnboarding({
    name: "Анна Иваненко",
    phone: "+7 (900) 123-45-67",
  });
  expect(session.email).toBe("hello@gmail.com");
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
          <Route path="/chats" element={<div>chats-page</div>} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

test("opens edit and logout dialogs from the header and keeps demo data", async () => {
  const user = userEvent.setup();
  renderProfile();

  const root = document.querySelector("[data-dialog]");
  expect(root).toHaveAttribute("data-dialog", "none");
  expect(root).toHaveAttribute("data-profile-name", "Анна Иваненко");
  expect(root).toHaveAttribute("data-profile-email", "hello@gmail.com");
  expect(root).toHaveAttribute("data-balance", "34670");
  expect(root).toHaveAttribute("data-api-key-status", "empty");
  expect(root).toHaveAttribute("data-api-key", "");

  await user.click(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  );
  expect(root).toHaveAttribute("data-dialog", "edit");

  await user.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));
  expect(root).toHaveAttribute("data-dialog", "logout");
});

test("support button opens the chats route", async () => {
  const user = userEvent.setup();
  renderProfile();
  await user.click(
    screen.getByRole("button", { name: "Написать в поддержку" }),
  );
  expect(await screen.findByText("chats-page")).toBeInTheDocument();
});
