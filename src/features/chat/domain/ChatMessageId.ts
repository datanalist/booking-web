declare const chatMessageIdBrand: unique symbol;

/** Идентификатор сообщения. Не взаимозаменяем с id чата. */
export type ChatMessageId = string & { readonly [chatMessageIdBrand]: true };

const CHAT_MESSAGE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Парсит UUID в ChatMessageId. Иная строка непредставима. */
export function chatMessageId(value: string): ChatMessageId | null {
  if (!CHAT_MESSAGE_ID_RE.test(value)) {
    return null;
  }
  return value as ChatMessageId;
}
