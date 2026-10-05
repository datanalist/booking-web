import {
  messageTimeLabel,
  type MessageTimeLabel,
} from "../../domain/MessageTimeLabel";

/** Собирает подпись `ЧЧ:ММ` из локального времени отправки. */
export function formatMessageTime(date: Date): MessageTimeLabel {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const label = messageTimeLabel(`${hours}:${minutes}`);
  if (label === null) {
    throw new Error("Не удалось собрать время сообщения");
  }
  return label;
}
