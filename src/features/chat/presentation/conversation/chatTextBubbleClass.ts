import type { MessageReceipt } from "../../domain/ChatMessage";
import type { MessageAuthor } from "../../domain/MessageAuthor";
import { chatBubbleRadiusClass } from "./chatBubbleRadiusClass";

/** Заливка текстового пузыря: свои — тёплый фон, прочитанные чужие — белый, непрочитанные — мёд. */
export function chatTextBubbleClass(author: MessageAuthor, receipt: MessageReceipt): string {
  const tone = chatTextBubbleTone(author, receipt);
  const radius = chatBubbleRadiusClass(author);
  return `flex w-fit min-w-0 max-w-[419px] flex-col items-end overflow-hidden border p-3 ${radius} ${tone}`;
}

function chatTextBubbleTone(author: MessageAuthor, receipt: MessageReceipt): string {
  if (author === "peer" && receipt === "unread") {
    return "border-[#fbc028] bg-[rgba(251,192,40,0.35)]";
  }
  switch (author) {
    case "self":
      return "border-[rgba(251,192,40,0.17)] bg-[rgba(251,192,40,0.06)]";
    case "peer":
      return "border-[rgba(251,192,40,0.17)] bg-white";
  }
}
