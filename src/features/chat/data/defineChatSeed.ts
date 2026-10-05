import { chatId, type ChatId } from "../domain/ChatId";
import { chatMessageId, type ChatMessageId } from "../domain/ChatMessageId";
import type { MessageAuthor } from "../domain/MessageAuthor";
import { messageTimeLabel, type MessageTimeLabel } from "../domain/MessageTimeLabel";
import type { ChatAvatarKey, ChatCounterpartRole } from "../domain/ChatThread";

export type ChatSeedReceipt = "read" | "unread";

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

/** Демо-чат: профиль строки списка и реплики. Последняя реплика всегда текст. */
export type ChatSeed = {
  readonly id: ChatId;
  readonly counterpartName: string;
  readonly counterpartRole: ChatCounterpartRole;
  readonly avatarKey: ChatAvatarKey;
  readonly dateLabel: string;
  readonly listingTitle: string;
  readonly city: string;
  readonly datesLabel: string;
  readonly guestsLabel: string;
  readonly earlier: readonly ChatSeedTurn[];
  readonly last: ChatSeedText;
};

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

export type RawChatSeed = {
  readonly id: string;
  readonly counterpartName: string;
  readonly counterpartRole: ChatCounterpartRole;
  readonly avatarKey: ChatAvatarKey;
  readonly dateLabel: string;
  readonly listingTitle: string;
  readonly city: string;
  readonly datesLabel: string;
  readonly guestsLabel: string;
  readonly earlier: readonly (RawText | RawPhoto)[];
  readonly last: RawText;
};

/** Собирает брендированный сид. Пустые строки и кривое время не проходят. */
export function defineChatSeed(raw: RawChatSeed): ChatSeed {
  const earlier = raw.earlier.map(parseTurn);
  const last = parseText(raw.last);
  assertChronological([...earlier, last]);
  return {
    id: chatId(raw.id),
    counterpartName: requiredText(raw.counterpartName, "имя собеседника"),
    counterpartRole: raw.counterpartRole,
    avatarKey: raw.avatarKey,
    dateLabel: requiredText(raw.dateLabel, "дата переписки"),
    listingTitle: requiredText(raw.listingTitle, "название жилья"),
    city: requiredText(raw.city, "город"),
    datesLabel: requiredText(raw.datesLabel, "даты брони"),
    guestsLabel: requiredText(raw.guestsLabel, "число гостей"),
    earlier,
    last,
  };
}

/** Реплики по времени: ранние, затем последняя. */
export function chatSeedTurns(seed: ChatSeed): readonly ChatSeedTurn[] {
  return [...seed.earlier, seed.last];
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
