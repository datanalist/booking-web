import type { ChatMessage } from "../domain/ChatMessage";
import { chatMessageId, type ChatMessageId } from "../domain/ChatMessageId";
import type { ChatPhoto } from "../domain/ChatPhoto";
import { messageTimeLabel, type MessageTimeLabel } from "../domain/MessageTimeLabel";

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

/** Переписка из макета: гость слева, арендодатель справа, фото передаётся снаружи. */
export function chatMessagesMock(photo: ChatPhoto): readonly ChatMessage[] {
  return [
    {
      kind: "text",
      id: mustMessageId("11111111-1111-4111-8111-111111111111"),
      author: "peer",
      timeLabel: mustTime("10:05"),
      body: "Добрый день, возможно ли раннее заселение? Мы приезжаем к 12:30",
    },
    {
      kind: "text",
      id: mustMessageId("22222222-2222-4222-8222-222222222222"),
      author: "self",
      timeLabel: mustTime("10:05"),
      body: "Здравствуйте, Екатерина , к сожаланию, жилье еще не будет готово к заселению в 12:30. Но вы можете оставить багаж на 1 этаже в служебном помещении до момента заселения",
    },
    {
      kind: "text",
      id: mustMessageId("33333333-3333-4333-8333-333333333333"),
      author: "self",
      timeLabel: mustTime("10:07"),
      body: "Помещение находится слева от лифта, код двери 348957",
    },
    {
      kind: "photo",
      id: mustMessageId("44444444-4444-4444-8444-444444444444"),
      author: "self",
      timeLabel: mustTime("10:07"),
      photo,
    },
  ];
}
