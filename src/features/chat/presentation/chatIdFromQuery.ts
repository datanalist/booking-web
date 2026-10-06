import { chatSeedById } from "../data/chatSeeds";
import { chatId, type ChatId } from "../domain/ChatId";

/** Id чата из query `chat`, если такой сид есть. */
export function chatIdFromQuery(value: string | null): ChatId | null {
  if (value === null || value.trim().length === 0) {
    return null;
  }
  const id = chatId(value);
  return chatSeedById(id) === undefined ? null : id;
}
