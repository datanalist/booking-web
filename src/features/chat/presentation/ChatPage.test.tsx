import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { ChatPage } from "./ChatPage";

afterEach(() => {
  cleanup();
});

test("страница чатов показывает список", () => {
  render(<ChatPage />);
  expect(screen.getByRole("heading", { level: 1, name: "Чаты" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Екатерина Кондратьева/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Игнат Прокопенко/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Анна Иваненко/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Илья Филипов/ })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Нет чатов" })).not.toBeInTheDocument();
});

test("выбор чата открывает переписку", async () => {
  const user = userEvent.setup();
  render(<ChatPage />);
  await user.click(screen.getByRole("button", { name: /Екатерина Кондратьева/ }));
  const region = screen.getByRole("region", { name: "Переписка с Екатерина Кондратьева" });
  expect(screen.queryByText("Выберите чат")).not.toBeInTheDocument();
  expect(within(region).getByText("Добрый день, бронирование оплачено")).toBeInTheDocument();
  expect(within(region).getByRole("img", { name: "Фото помещения у лифта" })).toBeInTheDocument();
  expect(within(region).getByText(/раннее заселение/)).toBeInTheDocument();
});

test("пустой набор показывает экран без чатов", () => {
  render(<ChatPage threads={[]} />);
  expect(screen.getByRole("heading", { level: 1, name: "Чаты" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Нет чатов" })).toBeInTheDocument();
  expect(
    screen.getByText("Чаты с клиентами появятся после бронирования"),
  ).toBeInTheDocument();
});
