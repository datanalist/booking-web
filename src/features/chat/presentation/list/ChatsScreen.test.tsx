import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { CHAT_THREAD_MOCKS } from "../../data/chatThreadMocks";
import type { ChatId } from "../../domain/ChatId";
import { ChatsScreen } from "./ChatsScreen";

afterEach(() => {
  cleanup();
});

function renderScreen(
  selectedChatId: ChatId | null = null,
  onSelectChat: (chatId: ChatId) => void = () => undefined,
  renderConversation?: (chatId: ChatId) => string,
) {
  return render(
    <ChatsScreen
      selectedChatId={selectedChatId}
      onSelectChat={onSelectChat}
      renderConversation={renderConversation}
    />,
  );
}

test("рендерит список чатов из моков", () => {
  renderScreen();
  expect(screen.getByRole("button", { name: /Поддержка/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Екатерина Кондратьева/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Игнат Прокопенко/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Анна Иваненко/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Илья Филипов/ })).toBeInTheDocument();
  expect(screen.getByText("Добрый день, бронирование оплачено")).toBeInTheDocument();
  expect(screen.getAllByText("13:40")).toHaveLength(5);
});

test("бейдж непрочитанных жёлтый и только у чата с новыми сообщениями", () => {
  renderScreen();
  const badge = screen.getByRole("status", { name: "Непрочитанных: 2" });
  expect(badge).toHaveTextContent("2");
  expect(badge).toHaveClass("bg-[#fbc028]");
  const ignat = screen.getByRole("button", { name: /Игнат Прокопенко/ });
  expect(within(ignat).queryByRole("status")).not.toBeInTheDocument();
});

test("без выбранного чата показывает плейсхолдер", () => {
  renderScreen();
  const placeholder = screen.getByRole("region", { name: "Чат не выбран" });
  const caption = within(placeholder).getByText("Выберите чат");
  expect(caption).toHaveClass("text-[#525353]", "text-[16px]");
  const illustration = placeholder.querySelector("img");
  expect(illustration).not.toBeNull();
  expect(illustration).toHaveAttribute("width", "109.174");
  expect(illustration).toHaveAttribute("height", "100");
});

test("клик по строке передаёт идентификатор чата", async () => {
  const onSelectChat = vi.fn<(chatId: ChatId) => void>();
  const user = userEvent.setup();
  renderScreen(null, onSelectChat);
  await user.click(screen.getByRole("button", { name: /Анна Иваненко/ }));
  const anna = CHAT_THREAD_MOCKS.find((thread) => thread.counterpartName === "Анна Иваненко");
  if (anna === undefined) {
    throw new Error("В моках нет чата Анны");
  }
  expect(onSelectChat).toHaveBeenCalledWith(anna.id);
});

test("слот переписки заменяет плейсхолдер у выбранного чата", () => {
  const ekaterina = CHAT_THREAD_MOCKS.find(
    (thread) => thread.counterpartName === "Екатерина Кондратьева",
  );
  if (ekaterina === undefined) {
    throw new Error("В моках нет чата Екатерины");
  }
  renderScreen(ekaterina.id, () => undefined, (chatId) => `Переписка ${chatId}`);
  expect(screen.queryByText("Выберите чат")).not.toBeInTheDocument();
  expect(screen.getByText(`Переписка ${ekaterina.id}`)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Екатерина Кондратьева/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("поиск скрывает несовпавшие чаты", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.type(screen.getByRole("searchbox", { name: "Поиск" }), "филипов");
  expect(screen.getByRole("button", { name: /Илья Филипов/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Анна Иваненко/ })).not.toBeInTheDocument();
});
