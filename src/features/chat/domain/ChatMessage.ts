import type { ChatMessageId } from "./ChatMessageId";
import type { ChatPhoto } from "./ChatPhoto";
import type { MessageAuthor } from "./MessageAuthor";
import type { MessageTimeLabel } from "./MessageTimeLabel";

/** Прочтение входящего: свои сообщения всегда прочитаны. */
export type MessageReceipt = "read" | "unread";

type ChatMessageBase = {
  readonly id: ChatMessageId;
  readonly author: MessageAuthor;
  readonly timeLabel: MessageTimeLabel;
  readonly receipt: MessageReceipt;
};

export type TextChatMessage = ChatMessageBase & {
  readonly kind: "text";
  readonly body: string;
};

export type PhotoChatMessage = ChatMessageBase & {
  readonly kind: "photo";
  readonly photo: ChatPhoto;
};

/** Текст и фото — разные формы сообщения, без взаимоисключающих флагов. */
export type ChatMessage = TextChatMessage | PhotoChatMessage;
