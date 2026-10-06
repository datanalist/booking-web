import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { ChatPage } from "../ChatPage";
import { DefaultChatScreen } from "./DefaultChatScreen";

afterEach(() => {
  cleanup();
});

test("дефолтный экран показывает пустое состояние", () => {
  const { container } = render(<DefaultChatScreen />);

  expect(screen.getByRole("heading", { level: 2, name: "Нет чатов" })).toBeInTheDocument();
  expect(
    screen.getByText("Чаты с клиентами появятся после бронирования"),
  ).toBeInTheDocument();
  expect(container.querySelector("img")).not.toBeNull();
});

test("страница чата ставит заголовок над пустым состоянием", () => {
  render(<ChatPage threads={[]} />);

  expect(screen.getByRole("heading", { level: 1, name: "Чаты" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Нет чатов" })).toBeInTheDocument();
});
