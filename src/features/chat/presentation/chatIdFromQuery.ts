import { resolveCabinetDataSource } from "../../../api/pocketbase";
import { chatSeedById } from "../data/chatSeeds";
import { chatId, type ChatId } from "../domain/ChatId";

/**
 * Id чата из query `chat`.
 * Мок открывает только сид. PocketBase принимает id записи, которого в сиде нет.
 */
export function chatIdFromQuery(value: string | null): ChatId | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const id = chatId(trimmed);
  if (resolveCabinetDataSource() === "pocketbase") {
    return id;
  }
  return chatSeedById(id) === undefined ? null : id;
}
