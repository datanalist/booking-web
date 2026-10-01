import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { DeleteAnnouncementDialog } from "./DeleteAnnouncementDialog";

afterEach(() => {
  cleanup();
});

test("renders corrected copy and action buttons", () => {
  render(
    <DeleteAnnouncementDialog
      open
      onClose={() => undefined}
      onConfirm={() => undefined}
    />,
  );

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveAccessibleName("Удалить объявление?");
  expect(dialog.textContent).toContain("Все данные объявления будут удалены");
  expect(dialog.textContent).toContain("из приложения");
  expect(
    screen.getByRole("button", { name: "Вернуться" }),
  ).toBeInTheDocument();
  const deleteButton = screen.getByRole("button", { name: "Да, удалить" });
  expect(deleteButton).toBeInTheDocument();
  expect(deleteButton).toHaveClass("whitespace-nowrap");
  expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
});

test("Вернуться, крестик, Escape и затемнение вызывают onClose", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const { container, rerender } = render(
    <DeleteAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();

  rerender(
    <DeleteAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onClose).toHaveBeenCalledTimes(2);

  rerender(
    <DeleteAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(3);

  rerender(
    <DeleteAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  const overlay = container.querySelector(".fixed.inset-0");
  expect(overlay).not.toBeNull();
  fireEvent.click(overlay!);
  expect(onClose).toHaveBeenCalledTimes(4);
  expect(onConfirm).not.toHaveBeenCalled();
});

test("Да, удалить вызывает onConfirm", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  render(
    <DeleteAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Да, удалить" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});
