import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

afterEach(() => {
  cleanup();
});

const idleProps = {
  pending: false,
  onCancel: (): void => undefined,
  onConfirm: (): void => undefined,
};

test("закрытая модалка ничего не рендерит", () => {
  const { container } = render(
    <LogoutConfirmModal open={false} {...idleProps} />,
  );

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(container).toBeEmptyDOMElement();
});

test("открытая модалка показывает заголовок и равные кнопки", () => {
  render(<LogoutConfirmModal open {...idleProps} />);

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveAccessibleName("Выйти из аккаунта?");
  expect(
    screen.getByRole("heading", { name: "Выйти из аккаунта?" }),
  ).toBeInTheDocument();

  const cancel = screen.getByRole("button", { name: "Вернуться" });
  const confirm = screen.getByRole("button", { name: "Да, выйти" });
  expect(cancel).toHaveClass(
    "rounded-lg",
    "flex-1",
    "justify-center",
    "items-center",
    "text-center",
  );
  expect(confirm).toHaveClass(
    "rounded-lg",
    "flex-1",
    "justify-center",
    "items-center",
    "text-center",
  );
  expect(cancel).toHaveFocus();
});

test("Вернуться, крестик, Escape и оверлей вызывают onCancel", async () => {
  const user = userEvent.setup();
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

  const { rerender } = render(
    <LogoutConfirmModal
      open
      pending={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();

  rerender(
    <LogoutConfirmModal
      open
      pending={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onCancel).toHaveBeenCalledTimes(2);

  rerender(
    <LogoutConfirmModal
      open
      pending={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />,
  );
  await user.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledTimes(3);

  rerender(
    <LogoutConfirmModal
      open
      pending={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />,
  );
  const overlay = document.querySelector(".fixed.inset-0");
  if (!(overlay instanceof HTMLElement)) {
    throw new Error("оверлей не найден");
  }
  fireEvent.click(overlay);
  expect(onCancel).toHaveBeenCalledTimes(4);
  expect(onConfirm).not.toHaveBeenCalled();
});

test("Да, выйти вызывает onConfirm", async () => {
  const user = userEvent.setup();
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

  render(
    <LogoutConfirmModal
      open
      pending={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Да, выйти" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onCancel).not.toHaveBeenCalled();
});

test("pending блокирует обе кнопки", async () => {
  const user = userEvent.setup();
  const onCancel = vi.fn();
  const onConfirm = vi.fn();

  render(
    <LogoutConfirmModal
      open
      pending
      onCancel={onCancel}
      onConfirm={onConfirm}
    />,
  );

  const cancel = screen.getByRole("button", { name: "Вернуться" });
  const confirm = screen.getByRole("button", { name: "Да, выйти" });
  expect(cancel).toBeDisabled();
  expect(confirm).toBeDisabled();
  expect(cancel).toHaveClass("opacity-50");
  expect(confirm).toHaveClass("opacity-50");

  await user.click(cancel);
  await user.click(confirm);
  expect(onCancel).not.toHaveBeenCalled();
  expect(onConfirm).not.toHaveBeenCalled();
});
