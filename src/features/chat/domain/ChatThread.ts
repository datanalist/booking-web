import type { ChatId } from "./ChatId";

export type ChatCounterpartRole = "guest" | "moderator";

export type ChatAvatarKey = "ekaterina" | "ignat" | "anna" | "ilya";

export type UnreadCount = number & { readonly __brand: "UnreadCount" };

export type ChatClockLabel = string & { readonly __brand: "ChatClockLabel" };

export type ChatUnread =
  | { readonly status: "none" }
  | { readonly status: "unread"; readonly count: UnreadCount };

export type ChatThread = {
  readonly id: ChatId;
  readonly counterpartName: string;
  readonly counterpartRole: ChatCounterpartRole;
  readonly avatarKey: ChatAvatarKey;
  readonly preview: string;
  readonly sentAt: ChatClockLabel;
  readonly unread: ChatUnread;
};

export function unreadCount(value: number): UnreadCount {
  if (!Number.isInteger(value) || value < 1 || value > 99) {
    throw new Error("Число непрочитанных должно быть целым от 1 до 99");
  }
  return value as UnreadCount;
}

export function chatClockLabel(value: string): ChatClockLabel {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("Время сообщения записывается как ЧЧ:ММ");
  }
  return value as ChatClockLabel;
}
