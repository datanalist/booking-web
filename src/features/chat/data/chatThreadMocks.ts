import { chatId } from "../domain/ChatId";
import {
  chatClockLabel,
  unreadCount,
  type ChatThread,
} from "../domain/ChatThread";

const SENT_AT = chatClockLabel("13:40");

export const CHAT_THREAD_MOCKS: readonly ChatThread[] = [
  {
    id: chatId("chat-ekaterina"),
    counterpartName: "Екатерина Кондратьева",
    counterpartRole: "guest",
    avatarKey: "ekaterina",
    preview: "Добрый день, бронирование оплачено",
    sentAt: SENT_AT,
    unread: { status: "unread", count: unreadCount(2) },
  },
  {
    id: chatId("chat-ignat"),
    counterpartName: "Игнат Прокопенко",
    counterpartRole: "guest",
    avatarKey: "ignat",
    preview: "Хочу уточнить время заселения на 12 число",
    sentAt: SENT_AT,
    unread: { status: "none" },
  },
  {
    id: chatId("chat-anna"),
    counterpartName: "Анна Иваненко",
    counterpartRole: "guest",
    avatarKey: "anna",
    preview: "Можно ли подвинуть бронь на два дня?",
    sentAt: SENT_AT,
    unread: { status: "none" },
  },
  {
    id: chatId("chat-ilya"),
    counterpartName: "Илья Филипов",
    counterpartRole: "guest",
    avatarKey: "ilya",
    preview: "Понял, спасибо за быстрый ответ",
    sentAt: SENT_AT,
    unread: { status: "none" },
  },
];
