import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { SessionProvider } from "../app/session";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

afterEach(() => {
  cleanup();
});

test("forgot modal submits and shows success then Ok closes", async () => {
  const user = userEvent.setup();
  const onDone = vi.fn();
  const onClose = vi.fn();
  render(
    <SessionProvider>
      <ForgotPasswordModal open onClose={onClose} onDone={onDone} />
    </SessionProvider>,
  );
  await user.type(screen.getByPlaceholderText("Введите email"), "hello@gmail.com");
  await user.click(screen.getByRole("button", { name: "Отправить" }));
  expect(await screen.findByText(/выслано на/i)).toBeInTheDocument();
  expect(screen.getByText("hello@gmail.com")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Ок" }));
  expect(onDone).toHaveBeenCalled();
});

test("forgot modal close button calls onClose", async () => {
  const user = userEvent.setup();
  const onDone = vi.fn();
  const onClose = vi.fn();
  render(
    <SessionProvider>
      <ForgotPasswordModal open onClose={onClose} onDone={onDone} />
    </SessionProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onClose).toHaveBeenCalled();
});

test("submit stays disabled while email is empty", () => {
  render(
    <SessionProvider>
      <ForgotPasswordModal open onClose={() => {}} onDone={() => {}} />
    </SessionProvider>,
  );
  expect(screen.getByRole("button", { name: "Отправить" })).toBeDisabled();
});
