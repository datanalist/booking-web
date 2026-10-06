export type ChatId = string & { readonly __brand: "ChatId" };

export function chatId(value: string): ChatId {
  if (value.trim().length === 0) {
    throw new Error("Идентификатор чата не может быть пустым");
  }
  return value as ChatId;
}
