import type { ChatMessage } from "../../domain/ChatMessage";
import { chatMessageId } from "../../domain/ChatMessageId";
import type { ComposerSend } from "./ComposerSend";
import { formatMessageTime } from "./formatMessageTime";

/** Превращает отправку композера в сообщение текущей стороны. */
export function messageFromComposerSend(draft: ComposerSend, now: Date): ChatMessage {
  const id = chatMessageId(crypto.randomUUID());
  if (id === null) {
    throw new Error("Не удалось собрать id сообщения");
  }
  const timeLabel = formatMessageTime(now);
  switch (draft.kind) {
    case "text":
      return { kind: "text", id, author: "self", timeLabel, body: draft.body, receipt: "read" };
    case "photo":
      return {
        kind: "photo",
        id,
        author: "self",
        timeLabel,
        photo: draft.photo,
        receipt: "read",
      };
  }
}
