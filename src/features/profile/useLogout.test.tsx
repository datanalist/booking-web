import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createApi } from "../../api";
import { SESSION_KEY } from "../../api/keys";
import { SessionProvider } from "../../app/session";
import { useLogout } from "./useLogout";

function LogoutProbe(): ReactElement {
  const logout = useLogout();
  return (
    <button
      type="button"
      onClick={() => {
        void logout();
      }}
    >
      Выйти
    </button>
  );
}

beforeEach(async () => {
  localStorage.clear();
  const api = createApi(localStorage);
  await api.auth.register("a@mail.ru", "secret12");
  await api.auth.login("a@mail.ru", "secret12");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("clears the session and opens the login screen", async () => {
  const user = userEvent.setup();
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<LogoutProbe />} />
          <Route path="/login" element={<div>login-page</div>} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );

  expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
  await user.click(screen.getByRole("button", { name: "Выйти" }));
  expect(await screen.findByText("login-page")).toBeInTheDocument();
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
});
