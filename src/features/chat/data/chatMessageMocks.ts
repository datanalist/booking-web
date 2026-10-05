import type { ChatMessage } from "../domain/ChatMessage";
import type { ChatPhoto, ChatPhotoUrl } from "../domain/ChatPhoto";
import { chatId } from "../domain/ChatId";
import { chatSeedById } from "./chatSeeds";
import { chatSeedTurns, type ChatSeed, type ChatSeedTurn } from "./defineChatSeed";

export type ChatSeedPhotoUrls = {
  readonly message: ChatPhotoUrl;
  readonly cover: ChatPhotoUrl;
};

/** Сообщения чата: пометка прочтения в ленту не попадает, она нужна только списку. */
export function chatMessagesFromSeed(
  seed: ChatSeed,
  urls: ChatSeedPhotoUrls,
): readonly ChatMessage[] {
  return chatSeedTurns(seed).map((turn) => turnToMessage(turn, urls));
}

/** Переписка Екатерины из макета. Фото передаётся снаружи, адрес ассета живёт в UI. */
export function chatMessagesMock(photo: ChatPhoto): readonly ChatMessage[] {
  const seed = chatSeedById(chatId("chat-ekaterina"));
  if (seed === undefined) {
    throw new Error("В сиде нет чата Екатерины");
  }
  return chatMessagesFromSeed(seed, { message: photo.url, cover: photo.url });
}

function turnToMessage(turn: ChatSeedTurn, urls: ChatSeedPhotoUrls): ChatMessage {
  switch (turn.kind) {
    case "text":
      return {
        kind: "text",
        id: turn.id,
        author: turn.author,
        timeLabel: turn.time,
        body: turn.body,
      };
    case "photo":
      return {
        kind: "photo",
        id: turn.id,
        author: turn.author,
        timeLabel: turn.time,
        photo: {
          url: turn.slot === "message" ? urls.message : urls.cover,
          alt: turn.alt,
        },
      };
  }
}
