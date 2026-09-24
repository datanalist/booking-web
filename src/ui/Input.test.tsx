import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Input } from "./Input";

afterEach(() => {
  cleanup();
});

test("input shows error not html", () => {
  render(
    <Input
      label="Email"
      value="<b>x</b>"
      onChange={() => {}}
      error="Неверный email или пароль"
    />,
  );
  expect(screen.getByText("Неверный email или пароль")).toBeInTheDocument();
  expect(screen.getByDisplayValue("<b>x</b>")).toBeInTheDocument();
});

test("auth variant uses orange field styles", () => {
  render(
    <Input
      label="Email"
      value=""
      onChange={() => {}}
      variant="auth"
      placeholder="Введите email"
    />,
  );
  const field = screen.getByPlaceholderText("Введите email");
  expect(field.className).toMatch(/251,\s*192,\s*40|fbc028/i);
});

test("passwordToggle switches type", async () => {
  const user = userEvent.setup();
  render(
    <Input
      label="Пароль"
      value="secret"
      onChange={() => {}}
      type="password"
      passwordToggle
      variant="auth"
    />,
  );
  const field = screen.getByLabelText("Пароль") as HTMLInputElement;
  expect(field.type).toBe("password");
  await user.click(
    screen.getByRole("button", { name: /показать пароль|скрыть пароль/i }),
  );
  expect(field.type).toBe("text");
});

test("root is full width so passwordToggle stays inside the field box", () => {
  const { container } = render(
    <Input
      label="Пароль"
      value="secret"
      onChange={() => {}}
      type="password"
      passwordToggle
      variant="auth"
    />,
  );
  const root = container.firstElementChild;
  expect(root?.className).toMatch(/\bw-full\b/);
  const field = screen.getByLabelText("Пароль");
  expect(field.className).toMatch(/\bw-full\b/);
  expect(field.className).toMatch(/h-\[44px]/);
  expect(field.className).toMatch(/\bpr-11\b/);
  const toggle = screen.getByRole("button", {
    name: /показать пароль|скрыть пароль/i,
  });
  expect(toggle.className).toMatch(/\babsolute\b/);
  expect(toggle.parentElement?.className).toMatch(/\brelative\b/);
  expect(toggle.parentElement?.className).toMatch(/\bw-full\b/);
});

test("invalid draws red border without requiring error text", () => {
  render(
    <Input
      label="Email"
      value="a@b.c"
      onChange={() => {}}
      variant="auth"
      invalid
    />,
  );
  const field = screen.getByDisplayValue("a@b.c");
  expect(field.className).toMatch(/e34043|#e34043/);
});
