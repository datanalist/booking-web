import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { ModerationSentDialog } from "./ModerationSentDialog";

afterEach(() => {
  cleanup();
});

test("renders Figma copy and Ok closes", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<ModerationSentDialog open onClose={onClose} />);

  expect(
    screen.getByRole("heading", {
      name: "Объявление отправлено на модерацию",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Администартор проверит ваше объявление/i),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Ок" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("close icon and Escape call onClose", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<ModerationSentDialog open onClose={onClose} />);

  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onClose).toHaveBeenCalledTimes(1);

  onClose.mockClear();
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(1);
});
