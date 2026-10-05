import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { ApiKeyStatusLine } from "./ApiKeyStatusLine";

afterEach(() => {
  cleanup();
});

test("disconnected не показывает строку статуса", () => {
  render(<ApiKeyStatusLine status="disconnected" />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByText("Подключено")).not.toBeInTheDocument();
  expect(screen.queryByText("Ошибка подключения")).not.toBeInTheDocument();
});

test("connected показывает иконку и зелёный текст", () => {
  render(<ApiKeyStatusLine status="connected" />);
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("Подключено");
  const icon = status.querySelector("img");
  expect(icon).toHaveAttribute("src", "/profile/icon-check-circle.svg");
  expect(icon).toHaveAttribute("alt", "");
  expect(status.querySelector("span")).toHaveClass("text-[#4aa446]");
});

test("error показывает иконку и красный текст", () => {
  render(<ApiKeyStatusLine status="error" />);
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("Ошибка подключения");
  const icon = status.querySelector("img");
  expect(icon).toHaveAttribute("src", "/profile/icon-warning-circle.svg");
  expect(icon).toHaveAttribute("alt", "");
  expect(status.querySelector("span")).toHaveClass("text-[#e34043]");
});
