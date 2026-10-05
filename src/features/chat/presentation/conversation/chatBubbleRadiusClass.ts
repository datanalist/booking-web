import type { MessageAuthor } from "../../domain/MessageAuthor";

/** Хвостик пузыря: у своих срезан правый нижний угол, у чужих — левый. */
export function chatBubbleRadiusClass(author: MessageAuthor): string {
  switch (author) {
    case "self":
      return "rounded-tl-lg rounded-tr-lg rounded-bl-lg";
    case "peer":
      return "rounded-tl-lg rounded-tr-lg rounded-br-lg";
  }
}
