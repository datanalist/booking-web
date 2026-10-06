import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createApi } from "../../api";
import { SessionProvider } from "../../app/session";
import { CabinetLayout } from "../../pages/CabinetLayout";
import { ProfilePage } from "./ProfilePage";

const PHOTO = "data:image/png;base64,oldphoto";

beforeEach(async () => {
  localStorage.clear();
  const api = createApi(localStorage);
  await api.auth.register("hello@gmail.com", "secret12");
  await api.auth.completeOnboarding({
    name: "Анна Иваненко",
    phone: "+7 (900) 123-45-67",
    photo: PHOTO,
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function accountAvatar(): HTMLImageElement {
  const image = document.querySelector("aside header img");
  if (!(image instanceof HTMLImageElement)) {
    throw new Error("аватар сайдбара не найден");
  }
  return image;
}

function renderCabinetProfile(): void {
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route
            path="/profile"
            element={
              <CabinetLayout>
                <ProfilePage />
              </CabinetLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

test("сохранение алерта сразу меняет имя, email и фото в сайдбаре", async () => {
  const user = userEvent.setup();
  renderCabinetProfile();

  expect(screen.getByText("Анна Иваненко")).toBeInTheDocument();
  expect(screen.getByText("hello@gmail.com")).toBeInTheDocument();
  expect(accountAvatar()).toHaveAttribute("src", PHOTO);

  await user.click(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  );
  const dialog = screen.getByRole("dialog", {
    name: "Редактировать данные профиля",
  });
  const name = within(dialog).getByLabelText("Имя");
  const email = within(dialog).getByLabelText("Email");
  await user.clear(name);
  await user.type(name, "Мария Петрова");
  await user.clear(email);
  await user.type(email, "Maria@Mail.ru");
  await user.click(within(dialog).getByRole("button", { name: "Удалить фото" }));
  await user.click(within(dialog).getByRole("button", { name: "Сохранить" }));

  expect(await screen.findByText("Мария Петрова")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByText("maria@mail.ru")).toBeInTheDocument();
  expect(accountAvatar()).toHaveAttribute("src", "/avatar-placeholder.png");
  expect(screen.getByLabelText("Имя")).toHaveValue("Мария Петрова");
  expect(screen.getByLabelText("Email:")).toHaveValue("maria@mail.ru");

  cleanup();
  renderCabinetProfile();
  expect(screen.getByText("Мария Петрова")).toBeInTheDocument();
  expect(screen.getByText("maria@mail.ru")).toBeInTheDocument();
  expect(accountAvatar()).toHaveAttribute("src", "/avatar-placeholder.png");
});
