const MOCK_SUPPORT_CHAT_ID = "chat-support";

/** Адрес экрана чатов с уже открытой перепиской. В моке — сид, в PocketBase — id записи. */
export function supportChatHref(chatId = MOCK_SUPPORT_CHAT_ID): string {
  return `/chats?chat=${encodeURIComponent(chatId)}`;
}
