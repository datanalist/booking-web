import type { MessageAuthor } from "../../domain/MessageAuthor";
import { chatBubbleRadiusClass } from "./chatBubbleRadiusClass";

/** Заливка текстового пузыря: свои — тёплый фон макета, чужие — белый. */
export function chatTextBubbleClass(author: MessageAuthor): string {
  const fill = chatTextBubbleFill(author);
  const radius = chatBubbleRadiusClass(author);
  return `flex w-fit max-w-[419px] flex-col items-end border border-[rgba(251,192,40,0.17)] p-3 ${radius} ${fill}`;
}

function chatTextBubbleFill(author: MessageAuthor): string {
  switch (author) {
    case "self":
      return "bg-[rgba(251,192,40,0.06)]";
    case "peer":
      return "bg-white";
  }
}
