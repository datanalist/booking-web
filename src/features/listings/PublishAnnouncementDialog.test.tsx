import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { PublishAnnouncementDialog } from "./PublishAnnouncementDialog";

afterEach(() => {
  cleanup();
});

test("renders corrected copy and action buttons", () => {
  render(
    <PublishAnnouncementDialog
      open
      onClose={() => undefined}
      onConfirm={() => undefined}
    />,
  );

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveAccessibleName("Опубликовать объявление?");
  expect(dialog.textContent).toContain(
    "Объявление будет отображаться пользователям и станет доступным для бронирования",
  );
  expect(
    screen.getByRole("button", { name: "Вернуться" }),
  ).toBeInTheDocument();
  const publishButton = screen.getByRole("button", {
    name: "Да, опубликовать",
  });
  expect(publishButton).toBeInTheDocument();
  expect(publishButton).toHaveClass("whitespace-nowrap");
  expect(screen.getByRole("button", { name: "Вернуться" })).toHaveClass(
    "whitespace-nowrap",
  );
  expect(dialog).toHaveClass("w-[438px]");
  expect(dialog).toHaveClass("p-6");
  expect(dialog).toHaveClass("gap-10");
  expect(dialog).toHaveClass("rounded-xl");
  expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
});

test("Вернуться, крестик, Escape и затемнение вызывают onClose", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const { container, rerender } = render(
    <PublishAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();

  rerender(
    <PublishAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onClose).toHaveBeenCalledTimes(2);

  rerender(
    <PublishAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(3);

  rerender(
    <PublishAnnouncementDialog
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

test("Да, опубликовать вызывает onConfirm", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  render(
    <PublishAnnouncementDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Да, опубликовать" }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});
