import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { ApiKeyCard } from "./ApiKeyCard";
import type { ApiKeyCardProps } from "./ApiKeyCard";

afterEach(() => {
  cleanup();
});

function renderCard(overrides: Partial<ApiKeyCardProps> = {}) {
  const props: ApiKeyCardProps = {
    status: "disconnected",
    apiKey: "",
    onApiKeyChange: vi.fn(),
    onConnect: vi.fn(),
    ...overrides,
  };
  render(<ApiKeyCard {...props} />);
  return props;
}

test("disconnected: нет строки статуса, есть поле и кнопка", () => {
  renderCard({ status: "disconnected" });
  expect(screen.getByText("API Key TravelLine")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByLabelText("API Key")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Подключить" })).toHaveClass(
    "rounded-[30px]",
    "bg-[#f88a2a]",
  );
});

test("connected: зелёная строка «Подключено»", () => {
  renderCard({ status: "connected", apiKey: "123456789" });
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("Подключено");
  expect(status.querySelector("span")).toHaveClass("text-[#4aa446]");
  expect(screen.getByLabelText("API Key")).toHaveValue("123456789");
});

test("error: красная строка «Ошибка подключения», поле без красной обводки", () => {
  renderCard({ status: "error", apiKey: "123456789" });
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("Ошибка подключения");
  expect(status.querySelector("span")).toHaveClass("text-[#e34043]");
  expect(screen.getByLabelText("API Key").className).toContain(
    "border-[rgba(251,192,40,0.17)]",
  );
});

test("ввод в поле вызывает onApiKeyChange", async () => {
  const user = userEvent.setup();
  const props = renderCard({ apiKey: "" });
  await user.type(screen.getByLabelText("API Key"), "7");
  expect(props.onApiKeyChange).toHaveBeenCalledWith("7");
});

test("клик «Подключить» вызывает onConnect", async () => {
  const user = userEvent.setup();
  const props = renderCard();
  await user.click(screen.getByRole("button", { name: "Подключить" }));
  expect(props.onConnect).toHaveBeenCalledOnce();
});

test("подпись API Key связана с полем", () => {
  renderCard();
  const input = screen.getByLabelText("API Key");
  const label = screen.getByText("API Key");
  expect(label).toHaveAttribute("for", input.id);
  expect(input.id).not.toBe("");
});
