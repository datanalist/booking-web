import { expect, test } from "vitest";
import { CHAT_THREAD_MOCKS } from "../../data/chatThreadMocks";
import { chatId } from "../../domain/ChatId";
import { applyLiveMessage, clearChatUnread } from "./applyThreadInbox";

const EKATERINA = chatId("chat-ekaterina");

test("открытый чат сразу теряет бейдж", () => {
  const cleared = clearChatUnread(CHAT_THREAD_MOCKS, EKATERINA);
  const thread = cleared.find((item) => item.id === EKATERINA);
  expect(thread?.unread).toEqual({ status: "none" });
  expect(cleared.find((item) => item.counterpartName === "Игнат Прокопенко")?.unread).toEqual({
    status: "none",
  });
});

test("чужое сообщение в закрытом чате поднимает строку и увеличивает бейдж", () => {
  const next = applyLiveMessage(CHAT_THREAD_MOCKS, {
    chatId: EKATERINA,
    preview: "Мы на месте",
    sentAt: "00:20",
    incoming: true,
    chatIsOpen: false,
  });
  expect(next[0]?.id).toBe(EKATERINA);
  expect(next[0]?.preview).toBe("Мы на месте");
  expect(next[0]?.sentAt).toBe("00:20");
  expect(next[0]?.unread).toEqual({ status: "unread", count: 3 });
});

test("сообщение в открытом чате обновляет превью и не возвращает бейдж", () => {
  const next = applyLiveMessage(clearChatUnread(CHAT_THREAD_MOCKS, EKATERINA), {
    chatId: EKATERINA,
    preview: "Мы на месте",
    sentAt: "00:20",
    incoming: true,
    chatIsOpen: true,
  });
  expect(next[0]?.unread).toEqual({ status: "none" });
  expect(next[0]?.preview).toBe("Мы на месте");
});

test("своё сообщение не увеличивает бейдж закрытого чата", () => {
  const next = applyLiveMessage(CHAT_THREAD_MOCKS, {
    chatId: EKATERINA,
    preview: "Ждём вас",
    sentAt: "00:21",
    incoming: false,
    chatIsOpen: false,
  });
  expect(next[0]?.unread).toEqual({ status: "unread", count: 2 });
});
