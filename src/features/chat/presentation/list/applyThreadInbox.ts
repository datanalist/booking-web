import type { ChatId } from "../../domain/ChatId";
import { chatClockLabel, unreadCount, type ChatClockLabel, type ChatThread } from "../../domain/ChatThread";

const UNREAD_CAP = 99;

/** Открытый чат в списке без бейджа: его уже читают. */
export function clearChatUnread(
  threads: readonly ChatThread[],
  chatId: ChatId | null,
): readonly ChatThread[] {
  if (chatId === null) {
    return threads;
  }
  return threads.map((thread) =>
    thread.id === chatId ? { ...thread, unread: { status: "none" } } : thread,
  );
}

/** Новое сообщение сразу меняет превью, время, порядок и бейдж, не дожидаясь повторной загрузки. */
export function applyLiveMessage(
  threads: readonly ChatThread[],
  input: {
    readonly chatId: ChatId;
    readonly preview: string;
    readonly sentAt: string;
    readonly incoming: boolean;
    readonly chatIsOpen: boolean;
  },
): readonly ChatThread[] {
  const index = threads.findIndex((thread) => thread.id === input.chatId);
  if (index < 0) {
    return threads;
  }
  const thread = threads[index];
  if (thread === undefined) {
    return threads;
  }
  const sentAt = clockOrKeep(input.sentAt, thread.sentAt);
  const preview = input.preview.trim().length > 0 ? input.preview.trim() : thread.preview;
  const updated: ChatThread = {
    ...thread,
    preview,
    sentAt,
    unread: nextUnread(thread, input.incoming, input.chatIsOpen),
  };
  return [updated, ...threads.filter((item) => item.id !== thread.id)];
}

function nextUnread(
  thread: ChatThread,
  incoming: boolean,
  chatIsOpen: boolean,
): ChatThread["unread"] {
  if (chatIsOpen || !incoming) {
    return chatIsOpen ? { status: "none" } : thread.unread;
  }
  if (thread.unread.status === "none") {
    return { status: "unread", count: unreadCount(1) };
  }
  return { status: "unread", count: unreadCount(Math.min(thread.unread.count + 1, UNREAD_CAP)) };
}

function clockOrKeep(value: string, fallback: ChatClockLabel): ChatClockLabel {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return fallback;
  }
  return chatClockLabel(value);
}
