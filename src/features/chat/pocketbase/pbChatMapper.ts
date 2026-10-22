import { chatId, type ChatId } from "../domain/ChatId";
import type { ChatMessage, MessageReceipt } from "../domain/ChatMessage";
import { chatPhotoUrl } from "../domain/ChatPhoto";
import {
  unreadCount,
  type ChatAvatarKey,
  type ChatCounterpartRole,
  type ChatThread,
  type ChatUnread,
} from "../domain/ChatThread";
import type { ConversationHeading } from "../domain/ConversationHeading";
import type { MessageAuthor } from "../domain/MessageAuthor";
import type { ComposerSend } from "../presentation/conversation/ComposerSend";
import {
  clockFromIso,
  pbFileUrl,
  stayDatesLabel,
  stayGuestsLabel,
  timeLabelFromIso,
} from "./pbChatFormat";
import { messageIdFor } from "./pbMessageId";
import type {
  PbChatRecord,
  PbMessageRecord,
  PbNotificationRecord,
  PbUserExpand,
} from "./pbChatTypes";

/** Тело создания записи `messages`. */
export type PbSendMessagePayload = {
  readonly chat: string;
  readonly author: string;
  readonly text?: string;
  readonly images?: readonly string[];
};

/** Отметка прочтения чата хозяином. */
export type PbMarkChatReadPayload = {
  readonly host_last_read: string;
};

const SUPPORT_NAME = "Поддержка";
const GUEST_FALLBACK = "Гость";
const MODERATOR_FALLBACK = "Модератор";
const UNREAD_CAP = 99;

/** Строка списка чатов из записи `chats` и, при необходимости, её сообщений. */
export function pbChatToThread(
  chat: PbChatRecord,
  messages?: readonly PbMessageRecord[],
  currentHostId?: string,
  baseUrl?: string,
): ChatThread {
  const role = counterpartRole(chat);
  return {
    id: asChatId(chat.id),
    counterpartRole: role,
    counterpartName: counterpartName(chat),
    avatarKey: avatarKeyFor(role),
    avatarUrl: avatarFileUrl(chat, baseUrl),
    preview: threadPreview(chat, messages),
    sentAt: clockFromIso(chat.last_message_at ?? chat.updated),
    unread: unreadFromMessages(chat, messages ?? [], currentHostId),
  };
}

/** Шапка открытого диалога: поддержка без карточки жилья, остальные — с объявлением. */
export function pbChatToHeading(
  chat: PbChatRecord,
  baseUrl?: string,
): ConversationHeading {
  const peerName = counterpartName(chat);
  const peerAvatarUrl = avatarFileUrl(chat, baseUrl);
  if (chat.kind === "support") {
    return { kind: "direct", peerName, peerAvatarUrl };
  }
  const listing = chat.expand?.listing;
  const booking = chat.expand?.booking;
  const thumb = listing?.photos?.find((name) => name.trim().length > 0);
  return {
    kind: "listing",
    peerName,
    peerAvatarUrl,
    listingTitle: listing?.title?.trim() ?? "",
    city: listing?.city?.trim() ?? "",
    datesLabel: stayDatesLabel(booking),
    guestsLabel: stayGuestsLabel(booking),
    listingThumbUrl:
      listing !== undefined && thumb !== undefined
        ? pbFileUrl(baseUrl, "listings", listing.id, thumb)
        : "",
  };
}

/**
 * Одно сообщение PocketBase — текст и каждое фото отдельно.
 * Файлы сотрудника (`files`) в ленту фото не попадают.
 */
export function pbMessageToChatMessage(
  msg: PbMessageRecord,
  currentUserId: string,
  baseUrl?: string,
  hostLastRead = "",
): ChatMessage[] {
  const author: MessageAuthor = msg.author === currentUserId ? "self" : "peer";
  const timeLabel = timeLabelFromIso(msg.created);
  const receipt = receiptFor(msg, currentUserId, hostLastRead);
  const text = visibleText(msg.text);
  const images = (msg.images ?? []).filter((name) => name.trim().length > 0);
  const messages: ChatMessage[] = [];
  if (text !== null) {
    messages.push({
      kind: "text",
      id: messageIdFor(msg.id, images.length === 0 ? "primary" : "text"),
      author,
      timeLabel,
      body: text,
      receipt,
    });
  }
  images.forEach((filename, index) => {
    const url = chatPhotoUrl(pbFileUrl(baseUrl, "messages", msg.id, filename));
    if (url === null) {
      return;
    }
    const onlyPhoto = text === null && images.length === 1;
    messages.push({
      kind: "photo",
      id: messageIdFor(msg.id, onlyPhoto ? "primary" : `photo:${index}`),
      author,
      timeLabel,
      receipt,
      photo: { url, alt: filename },
    });
  });
  return messages;
}

/** Поля новой записи `messages` из отправки композера. */
export function buildPbSendMessagePayload(input: {
  readonly chatId: string;
  readonly authorId: string;
  readonly send: ComposerSend;
}): PbSendMessagePayload {
  const base = { chat: input.chatId, author: input.authorId };
  switch (input.send.kind) {
    case "text":
      return { ...base, text: input.send.body };
    case "photo":
      return { ...base, images: [input.send.photo.url] };
  }
}

/** Поле `chats.host_last_read`. Без аргумента — текущий момент в ISO. */
export function buildPbMarkChatReadPayload(nowIso?: string): PbMarkChatReadPayload {
  return { host_last_read: nowIso ?? new Date().toISOString() };
}

/** Непрочитанные уведомления для бейджа сайдбара. */
export function countUnreadNotifications(
  records: readonly PbNotificationRecord[],
): number {
  return records.filter((record) => !record.read).length;
}

function asChatId(value: string): ChatId {
  return chatId(value);
}

function counterpartRole(chat: PbChatRecord): ChatCounterpartRole {
  if (chat.kind === "support") {
    return "support";
  }
  if (chat.staff !== undefined && chat.staff.trim().length > 0) {
    return "moderator";
  }
  return "guest";
}

function counterpartName(chat: PbChatRecord): string {
  if (chat.kind === "support") {
    return SUPPORT_NAME;
  }
  const fallback = counterpartRole(chat) === "moderator" ? MODERATOR_FALLBACK : GUEST_FALLBACK;
  return personName(counterpartPerson(chat), fallback);
}

/** Тот же человек, что и в имени: у модератора — сотрудник, у гостя — гость. */
function counterpartPerson(chat: PbChatRecord): PbUserExpand | undefined {
  if (chat.kind === "support") {
    return chat.expand?.staff ?? chat.expand?.guest;
  }
  if (counterpartRole(chat) === "moderator" && personName(chat.expand?.staff, "").length > 0) {
    return chat.expand?.staff;
  }
  return chat.expand?.guest;
}

/** Ключи аватаров макета: у поддержки свой, у гостя и модератора — гостевой портрет. */
function avatarKeyFor(role: ChatCounterpartRole): ChatAvatarKey {
  if (role === "support") {
    return "support";
  }
  return "ekaterina";
}

function personName(person: PbUserExpand | undefined, fallback: string): string {
  const named = person?.name?.trim() ?? "";
  if (named.length > 0) {
    return named;
  }
  const parts = [person?.first_name, person?.last_name]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return fallback;
}

function threadPreview(
  chat: PbChatRecord,
  messages: readonly PbMessageRecord[] | undefined,
): string {
  const stored = chat.last_message?.trim() ?? "";
  if (stored.length > 0) {
    return stored;
  }
  const latest = latestMessage(messages ?? []);
  return latest?.text?.trim() ?? "";
}

function latestMessage(
  messages: readonly PbMessageRecord[],
): PbMessageRecord | undefined {
  let latest: PbMessageRecord | undefined;
  for (const message of messages) {
    if (latest === undefined || message.created >= latest.created) {
      latest = message;
    }
  }
  return latest;
}

function unreadFromMessages(
  chat: PbChatRecord,
  messages: readonly PbMessageRecord[],
  currentHostId: string | undefined,
): ChatUnread {
  const incoming = countUnreadMessages(messages, chat.host_last_read ?? "", currentHostId);
  if (incoming < 1) {
    return { status: "none" };
  }
  return { status: "unread", count: unreadCount(Math.min(incoming, UNREAD_CAP)) };
}

function pbInstant(value: string): number | null {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const time = Date.parse(normalized);
  return Number.isNaN(time) ? null : time;
}

function receiptFor(
  msg: PbMessageRecord,
  currentUserId: string,
  hostLastRead: string,
): MessageReceipt {
  return isUnreadMessage(msg, hostLastRead, currentUserId) ? "unread" : "read";
}

function isUnreadMessage(
  msg: PbMessageRecord,
  hostLastRead: string,
  currentHostId: string | undefined,
): boolean {
  if (currentHostId !== undefined && msg.author === currentHostId) {
    return false;
  }
  const createdAt = pbInstant(msg.created);
  if (createdAt === null) {
    return false;
  }
  const readAt = hostLastRead.trim();
  if (readAt.length === 0) {
    return true;
  }
  const readInstant = pbInstant(readAt);
  return readInstant === null || createdAt > readInstant;
}

function countUnreadMessages(
  messages: readonly PbMessageRecord[],
  hostLastRead: string,
  currentHostId: string | undefined,
): number {
  return messages.filter((msg) => isUnreadMessage(msg, hostLastRead, currentHostId)).length;
}

function avatarFileUrl(chat: PbChatRecord, baseUrl: string | undefined): string {
  const person = counterpartPerson(chat);
  const filename = person?.avatar?.trim() ?? "";
  if (person === undefined || filename.length === 0) {
    return "";
  }
  return pbFileUrl(baseUrl, "users", person.id, filename);
}

function visibleText(text: string | undefined): string | null {
  if (text === undefined || text.trim().length === 0) {
    return null;
  }
  return text;
}

