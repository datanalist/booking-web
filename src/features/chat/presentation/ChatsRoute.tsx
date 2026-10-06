import { useSearchParams } from "react-router-dom";
import { ChatPage } from "./ChatPage";
import { chatIdFromQuery } from "./chatIdFromQuery";

/** Маршрут /chats: query `chat` открывает переписку, иначе список без выбора. */
export function ChatsRoute() {
  const [params] = useSearchParams();
  return <ChatPage initialChatId={chatIdFromQuery(params.get("chat"))} />;
}
