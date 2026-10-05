import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { ProfileHeader } from "./ProfileHeader";

afterEach(() => {
  cleanup();
});

test("exposes edit and logout by aria-label and support by its text", () => {
  render(
    <ProfileHeader
      onEditClick={() => undefined}
      onLogoutClick={() => undefined}
      onSupportClick={() => undefined}
    />,
  );

  expect(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Выйти из аккаунта" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Написать в поддержку" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Профиль" })).toBeInTheDocument();
});

test("calls the matching callback for each header action", async () => {
  const user = userEvent.setup();
  const onEditClick = vi.fn();
  const onLogoutClick = vi.fn();
  const onSupportClick = vi.fn();

  render(
    <ProfileHeader
      onEditClick={onEditClick}
      onLogoutClick={onLogoutClick}
      onSupportClick={onSupportClick}
    />,
  );

  await user.click(
    screen.getByRole("button", { name: "Редактировать профиль" }),
  );
  await user.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));
  await user.click(
    screen.getByRole("button", { name: "Написать в поддержку" }),
  );

  expect(onEditClick).toHaveBeenCalledOnce();
  expect(onLogoutClick).toHaveBeenCalledOnce();
  expect(onSupportClick).toHaveBeenCalledOnce();
});
