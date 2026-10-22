import { chatId, type ChatId } from "../domain/ChatId";
import type { ChatMessage } from "../domain/ChatMessage";
import { clockFromIso } from "./pbChatFormat";
import { pbMessageToChatMessage } from "./pbChatMapper";
import type { PbMessageRecord } from "./pbChatTypes";
import type { ChatLiveNotice } from "./chatSource";

/** Событие realtime → уведомление списка. Чужое сообщение без курсора прочтения считается непрочитанным. */
export function noticeFromRealtime(
  topic: string,
  data: string,
  hostId: string,
  baseUrl: string,
  nextSeq: () => number,
): ChatLiveNotice | null {
  const parsed = parseJson(data);
  if (parsed === null) {
    return null;
  }
  const action = parsed.action;
  if (action !== "create" && action !== "update" && action !== "delete") {
    return null;
  }
  if (topic === "chats") {
    const id = recordId(parsed.record);
    if (id === null) {
      return null;
    }
    return { seq: nextSeq(), kind: "chat", chatId: id };
  }
  if (topic !== "messages") {
    return null;
  }
  const message = asMessage(parsed.record);
  if (message === null) {
    return null;
  }
  const messages = pbMessageToChatMessage(message, hostId, baseUrl, "");
  return {
    seq: nextSeq(),
    kind: "message",
    action,
    chatId: chatId(message.chat),
    incoming: message.author !== hostId,
    preview: messagePreview(message, messages),
    sentAt: clockFromIso(message.created),
    messages,
  };
}

function messagePreview(message: PbMessageRecord, messages: readonly ChatMessage[]): string {
  const text = messages.find((item) => item.kind === "text");
  if (text !== undefined && text.kind === "text") {
    return text.body;
  }
  const images = message.images ?? [];
  return images.length > 0 ? "Фото" : "";
}

function asMessage(value: unknown): PbMessageRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = value.id;
  const chat = value.chat;
  const author = value.author;
  const created = value.created;
  if (
    typeof id !== "string" ||
    typeof chat !== "string" ||
    chat.trim().length === 0 ||
    typeof author !== "string" ||
    typeof created !== "string"
  ) {
    return null;
  }
  const images = Array.isArray(value.images)
    ? value.images.filter((item): item is string => typeof item === "string")
    : undefined;
  return {
    id,
    chat,
    author,
    created,
    text: typeof value.text === "string" ? value.text : undefined,
    images,
  };
}

function recordId(value: unknown): ChatId | null {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.trim().length === 0) {
    return null;
  }
  return chatId(value.id);
}

function parseJson(data: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(data);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
