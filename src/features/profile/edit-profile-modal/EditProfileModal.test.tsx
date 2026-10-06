import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { EditProfileModal } from "./index";
import type { ProfileEditSaveResult, ProfileEditValues } from "./index";

const INITIAL: ProfileEditValues = {
  name: "Ирина Иванова",
  phone: "79001234567",
  email: "Hello@Gmail.com",
  photoUrl: "data:image/png;base64,abc",
};

afterEach(() => {
  cleanup();
});

function overlayOf(container: HTMLElement): HTMLElement {
  const overlay = container.querySelector(".fixed.inset-0");
  if (!(overlay instanceof HTMLElement)) {
    throw new Error("оверлей не найден");
  }
  return overlay;
}

test("при open=false диалог не рендерится", () => {
  render(
    <EditProfileModal
      open={false}
      initial={INITIAL}
      onClose={() => undefined}
      onSave={() => undefined}
    />,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("показывает заголовок, начальные значения и кнопку сохранения", () => {
  render(
    <EditProfileModal
      open
      initial={INITIAL}
      onClose={() => undefined}
      onSave={() => undefined}
    />,
  );

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveAccessibleName("Редактировать данные профиля");
  expect(dialog.className).toContain("w-[438px]");
  expect(screen.getByLabelText("Имя")).toHaveValue("Ирина Иванова");
  expect(screen.getByLabelText("Номер телефона")).toHaveValue(
    "+7 (900) 123-45-67",
  );
  expect(screen.getByLabelText("Email")).toHaveValue("Hello@Gmail.com");
  expect(screen.getByRole("button", { name: "Удалить фото" })).toBeInTheDocument();
  const save = screen.getByRole("button", { name: "Сохранить" });
  expect(save).toHaveAttribute("type", "submit");
  expect(save).toHaveClass("rounded-lg");
  expect(save.className).not.toMatch(/rounded-\[30px\]/);
  const file = document.querySelector("input[type='file']");
  expect(file).toHaveAttribute("accept", "image/*");
});

test("без фото кнопка «Удалить фото» скрыта", () => {
  const withoutPhoto: ProfileEditValues = {
    name: INITIAL.name,
    phone: INITIAL.phone,
    email: INITIAL.email,
  };
  render(
    <EditProfileModal
      open
      initial={withoutPhoto}
      onClose={() => undefined}
      onSave={() => undefined}
    />,
  );
  expect(screen.queryByRole("button", { name: "Удалить фото" })).toBeNull();
});

test("крестик, Escape и клик по оверлею вызывают onClose", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const { container, rerender } = render(
    <EditProfileModal
      open
      initial={INITIAL}
      onClose={onClose}
      onSave={() => undefined}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Закрыть" }));
  expect(onClose).toHaveBeenCalledTimes(1);

  rerender(
    <EditProfileModal
      open
      initial={INITIAL}
      onClose={onClose}
      onSave={() => undefined}
    />,
  );
  await user.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(2);

  rerender(
    <EditProfileModal
      open
      initial={INITIAL}
      onClose={onClose}
      onSave={() => undefined}
    />,
  );
  fireEvent.click(overlayOf(container));
  expect(onClose).toHaveBeenCalledTimes(3);
});

test("клик по диалогу не закрывает его", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <EditProfileModal
      open
      initial={INITIAL}
      onClose={onClose}
      onSave={() => undefined}
    />,
  );
  await user.click(screen.getByRole("dialog"));
  expect(onClose).not.toHaveBeenCalled();
});

test("Сохранить передаёт распарсенные значения", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn<(values: ProfileEditValues) => void>();
  render(
    <EditProfileModal
      open
      initial={{ ...INITIAL, name: "  Ирина  " }}
      onClose={() => undefined}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave.mock.calls[0]?.[0]).toEqual({
    name: "Ирина",
    phone: "+7 (900) 123-45-67",
    email: "hello@gmail.com",
    photoUrl: "data:image/png;base64,abc",
  });
});

test("невалидные данные не сохраняются и показывают ошибку", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(
    <EditProfileModal
      open
      initial={INITIAL}
      onClose={() => undefined}
      onSave={onSave}
    />,
  );

  await user.clear(screen.getByLabelText("Имя"));
  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "не-email");
  await user.click(screen.getByRole("button", { name: "Сохранить" }));

  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByText("Введите имя от 2 до 50 символов")).toBeInTheDocument();
  expect(screen.getByText("Введите корректный email")).toBeInTheDocument();
});

test("«Удалить фото» сбрасывает photoUrl", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn<(values: ProfileEditValues) => void>();
  render(
    <EditProfileModal
      open
      initial={INITIAL}
      onClose={() => undefined}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Удалить фото" }));
  expect(screen.queryByRole("button", { name: "Удалить фото" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(onSave.mock.calls[0]?.[0]?.photoUrl).toBeUndefined();
});

test("повторное открытие заново берёт initial, а не черновик", async () => {
  const user = userEvent.setup();
  const props = {
    initial: INITIAL,
    onClose: () => undefined,
    onSave: () => undefined,
  };
  const { rerender } = render(<EditProfileModal open {...props} />);
  await user.clear(screen.getByLabelText("Имя"));
  await user.type(screen.getByLabelText("Имя"), "Другое имя");

  rerender(<EditProfileModal open={false} {...props} />);
  rerender(<EditProfileModal open {...props} />);
  expect(screen.getByLabelText("Имя")).toHaveValue("Ирина Иванова");
});

test("ошибка сохранения остаётся у поля и диалог не закрывается", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn(
    async (): Promise<ProfileEditSaveResult> => ({
      status: "errors",
      errors: { email: "Такой email уже зарегистрирован" },
    }),
  );
  render(
    <EditProfileModal
      open
      initial={INITIAL}
      onClose={() => undefined}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(
    await screen.findByText("Такой email уже зарегистрирован"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("dialog", { name: "Редактировать данные профиля" }),
  ).toBeInTheDocument();
});

test("пока диалог открыт, новый объект initial не затирает ввод", async () => {
  const user = userEvent.setup();
  const onClose = () => undefined;
  const onSave = () => undefined;
  const { rerender } = render(
    <EditProfileModal open initial={INITIAL} onClose={onClose} onSave={onSave} />,
  );
  await user.clear(screen.getByLabelText("Имя"));
  await user.type(screen.getByLabelText("Имя"), "Другое имя");
  rerender(
    <EditProfileModal
      open
      initial={{ ...INITIAL }}
      onClose={onClose}
      onSave={onSave}
    />,
  );
  expect(screen.getByLabelText("Имя")).toHaveValue("Другое имя");
});
