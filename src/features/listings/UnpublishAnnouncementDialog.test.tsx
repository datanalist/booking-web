import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { UnpublishAnnouncementDialog } from "./UnpublishAnnouncementDialog";

afterEach(() => {
  cleanup();
});

test("renders corrected copy and action buttons", () => {
  render(
    <UnpublishAnnouncementDialog
      open
      onClose={() => undefined}
      onConfirm={() => undefined}
    />,
  );

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveAccessibleName("Снять объявление с публикации?");

  const body = screen.getByText(/перестанет отображаться пользователям/);
  expect(body.textContent).toMatch(/^Объявление /);
  expect(body.textContent).not.toMatch(/^Обявление /);

  expect(
    screen.getByRole("button", { name: "Вернуться" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Да, снять" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
});

test("Вернуться, крестик, Escape и затемнение вызывают onClose", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const { container, rerender } = render(
    <UnpublishAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();

  rerender(
    <UnpublishAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onClose).toHaveBeenCalledTimes(2);

  rerender(
    <UnpublishAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(3);

  rerender(
    <UnpublishAnnouncementDialog
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

test("Да, снять вызывает onConfirm", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  render(
    <UnpublishAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Да, снять" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});
