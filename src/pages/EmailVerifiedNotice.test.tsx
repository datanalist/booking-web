import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { App } from "../App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

test("подтверждение почты — пустая страница по центру окна, без макета сайта", () => {
  window.history.pushState(null, "", "/login?verified=1");
  render(<App />);

  const page = screen.getByRole("main");
  expect(page.className).toMatch(/min-h-screen/);
  expect(page.className).toMatch(/items-center/);
  expect(page.className).toMatch(/justify-center/);
  expect(page.className).toMatch(/bg-white/);
  expect(screen.getByRole("heading", { name: "Ваша почта подтверждена" })).toBeInTheDocument();
  expect(screen.getByText("Пожалуйста, вернитесь на страницу входа.")).toBeInTheDocument();
  expect(screen.queryByRole("img", { name: "GlobalStay" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Войти" })).toBeNull();
});
