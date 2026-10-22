import { chatId, type ChatId } from "../domain/ChatId";
import { chatMessageId, type ChatMessageId } from "../domain/ChatMessageId";
import type { MessageReceipt } from "../domain/ChatMessage";
import type { MessageAuthor } from "../domain/MessageAuthor";
import { messageTimeLabel, type MessageTimeLabel } from "../domain/MessageTimeLabel";
import type { ChatAvatarKey } from "../domain/ChatThread";

export type ChatSeedReceipt = MessageReceipt;

export type ChatSeedPhotoSlot = "message" | "cover";

export type ChatSeedText = {
  readonly kind: "text";
  readonly id: ChatMessageId;
  readonly author: MessageAuthor;
  readonly time: MessageTimeLabel;
  readonly body: string;
  readonly receipt: ChatSeedReceipt;
};

export type ChatSeedPhoto = {
  readonly kind: "photo";
  readonly id: ChatMessageId;
  readonly author: MessageAuthor;
  readonly time: MessageTimeLabel;
  readonly alt: string;
  readonly slot: ChatSeedPhotoSlot;
  readonly receipt: ChatSeedReceipt;
};

export type ChatSeedTurn = ChatSeedText | ChatSeedPhoto;

type ChatSeedBase = {
  readonly id: ChatId;
  readonly counterpartName: string;
  readonly avatarKey: ChatAvatarKey;
  readonly dateLabel: string;
  readonly earlier: readonly ChatSeedTurn[];
  readonly last: ChatSeedText;
  /** Время в строке списка. У поддержки не совпадает с временем последней реплики. */
  readonly listedAt: MessageTimeLabel;
};

/** Гостевой чат: в шапке есть объявление. */
export type GuestChatSeed = ChatSeedBase & {
  readonly counterpartRole: "guest" | "moderator";
  readonly listingTitle: string;
  readonly city: string;
  readonly datesLabel: string;
  readonly guestsLabel: string;
};

/** Чат поддержки: объявления нет. */
export type SupportChatSeed = ChatSeedBase & {
  readonly counterpartRole: "support";
};

/** Демо-чат: профиль строки списка и реплики. Последняя реплика всегда текст. */
export type ChatSeed = GuestChatSeed | SupportChatSeed;

type RawText = {
  readonly kind: "text";
  readonly id: string;
  readonly author: MessageAuthor;
  readonly time: string;
  readonly body: string;
  readonly receipt: ChatSeedReceipt;
};

type RawPhoto = {
  readonly kind: "photo";
  readonly id: string;
  readonly author: MessageAuthor;
  readonly time: string;
  readonly alt: string;
  readonly slot: ChatSeedPhotoSlot;
  readonly receipt: ChatSeedReceipt;
};

type RawSeedCommon = {
  readonly id: string;
  readonly counterpartName: string;
  readonly avatarKey: ChatAvatarKey;
  readonly dateLabel: string;
  readonly earlier: readonly (RawText | RawPhoto)[];
  readonly last: RawText;
  readonly listedAt?: string;
};

export type RawGuestChatSeed = RawSeedCommon & {
  readonly counterpartRole: "guest" | "moderator";
  readonly listingTitle: string;
  readonly city: string;
  readonly datesLabel: string;
  readonly guestsLabel: string;
};

export type RawSupportChatSeed = RawSeedCommon & {
  readonly counterpartRole: "support";
};

export type RawChatSeed = RawGuestChatSeed | RawSupportChatSeed;

/** Собирает брендированный сид. Пустые строки и кривое время не проходят. */
export function defineChatSeed(raw: RawChatSeed): ChatSeed {
  const earlier = raw.earlier.map(parseTurn);
  const last = parseText(raw.last);
  assertChronological([...earlier, last]);
  const base = seedBase(raw, earlier, last);
  if (raw.counterpartRole === "support") {
    return { ...base, counterpartRole: "support" };
  }
  return {
    ...base,
    counterpartRole: raw.counterpartRole,
    listingTitle: requiredText(raw.listingTitle, "название жилья"),
    city: requiredText(raw.city, "город"),
    datesLabel: requiredText(raw.datesLabel, "даты брони"),
    guestsLabel: requiredText(raw.guestsLabel, "число гостей"),
  };
}

/** Реплики по времени: ранние, затем последняя. */
export function chatSeedTurns(seed: ChatSeed): readonly ChatSeedTurn[] {
  return [...seed.earlier, seed.last];
}

function seedBase(
  raw: RawChatSeed,
  earlier: readonly ChatSeedTurn[],
  last: ChatSeedText,
): ChatSeedBase {
  return {
    id: chatId(raw.id),
    counterpartName: requiredText(raw.counterpartName, "имя собеседника"),
    avatarKey: raw.avatarKey,
    dateLabel: requiredText(raw.dateLabel, "дата переписки"),
    earlier,
    last,
    listedAt: mustTime(raw.listedAt ?? raw.last.time),
  };
}

function parseTurn(raw: RawText | RawPhoto): ChatSeedTurn {
  switch (raw.kind) {
    case "text":
      return parseText(raw);
    case "photo":
      return parsePhoto(raw);
  }
}

function parseText(raw: RawText): ChatSeedText {
  return {
    kind: "text",
    id: mustMessageId(raw.id),
    author: raw.author,
    time: mustTime(raw.time),
    body: requiredText(raw.body, "текст сообщения"),
    receipt: raw.receipt,
  };
}

function parsePhoto(raw: RawPhoto): ChatSeedPhoto {
  return {
    kind: "photo",
    id: mustMessageId(raw.id),
    author: raw.author,
    time: mustTime(raw.time),
    alt: requiredText(raw.alt, "подпись фото"),
    slot: raw.slot,
    receipt: raw.receipt,
  };
}

function requiredText(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`В сиде чата пустое поле: ${label}`);
  }
  return trimmed;
}

function mustMessageId(value: string): ChatMessageId {
  const id = chatMessageId(value);
  if (id === null) {
    throw new Error(`Некорректный id сообщения: ${value}`);
  }
  return id;
}

function mustTime(value: string): MessageTimeLabel {
  const time = messageTimeLabel(value);
  if (time === null) {
    throw new Error(`Некорректное время: ${value}`);
  }
  return time;
}

function assertChronological(turns: readonly ChatSeedTurn[]): void {
  let previous = -1;
  for (const turn of turns) {
    const minutes = minutesOf(turn.time);
    if (minutes < previous) {
      throw new Error("Сообщения в сиде идут не по времени");
    }
    previous = minutes;
  }
}

function minutesOf(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  const hours = match?.[1];
  const minutes = match?.[2];
  if (hours === undefined || minutes === undefined) {
    throw new Error("Время сообщения не разобрано");
  }
  return Number(hours) * 60 + Number(minutes);
}
