import { expect, test } from "vitest";
import { CHAT_THREAD_MOCKS } from "../../data/chatThreadMocks";
import { filterChatThreads } from "./filterChatThreads";

test("пустой запрос возвращает все чаты", () => {
  expect(filterChatThreads(CHAT_THREAD_MOCKS, "  ")).toEqual(CHAT_THREAD_MOCKS);
});

test("фильтр ищет по имени без учёта регистра", () => {
  const found = filterChatThreads(CHAT_THREAD_MOCKS, "игнат");
  expect(found.map((thread) => thread.counterpartName)).toEqual([
    "Игнат Прокопенко",
  ]);
});

test("фильтр ищет по тексту превью", () => {
  const found = filterChatThreads(CHAT_THREAD_MOCKS, "бронь");
  expect(found.map((thread) => thread.counterpartName)).toEqual([
    "Анна Иваненко",
  ]);
});
