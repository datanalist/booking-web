import type { MessageReceipt } from "../../domain/ChatMessage";
import type { MessageAuthor } from "../../domain/MessageAuthor";
import { chatBubbleRadiusClass } from "./chatBubbleRadiusClass";

/** Рамка фото-сообщения: скругление по автору, непрочитанное входящее — жёлтая обводка. */
export function chatPhotoFrameClass(author: MessageAuthor, receipt: MessageReceipt): string {
  const radius = chatBubbleRadiusClass(author);
  const border =
    author === "peer" && receipt === "unread" ? "border-[#fbc028]" : "border-[rgba(251,192,40,0.17)]";
  return `relative flex h-[268px] w-[239px] shrink-0 flex-col items-end justify-end overflow-hidden border p-3 ${radius} ${border}`;
}
