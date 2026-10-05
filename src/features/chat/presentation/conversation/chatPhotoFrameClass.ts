import type { MessageAuthor } from "../../domain/MessageAuthor";
import { chatBubbleRadiusClass } from "./chatBubbleRadiusClass";

/** Рамка фото-сообщения: скругление по автору, снимок заполняет пузырь. */
export function chatPhotoFrameClass(author: MessageAuthor): string {
  const radius = chatBubbleRadiusClass(author);
  return `relative flex h-[268px] w-[239px] shrink-0 flex-col items-end justify-end overflow-hidden border border-[rgba(251,192,40,0.17)] p-3 ${radius}`;
}
