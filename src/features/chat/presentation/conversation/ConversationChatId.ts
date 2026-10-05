declare const conversationChatIdBrand: unique symbol;

/**
 * Локальный id открытого чата.
 * При интеграции свести с общим ChatId из списка чатов.
 */
export type ConversationChatId = string & {
  readonly [conversationChatIdBrand]: true;
};

/** Пустая строка не становится id переписки. */
export function conversationChatId(value: string): ConversationChatId | null {
  if (value.trim().length === 0) {
    return null;
  }
  return value as ConversationChatId;
}
