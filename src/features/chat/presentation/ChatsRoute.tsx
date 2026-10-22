import { useSearchParams } from "react-router-dom";
import { useSession } from "../../../app/session";
import { ChatPage } from "./ChatPage";
import { chatIdFromQuery } from "./chatIdFromQuery";

/** Маршрут /chats: query `chat` открывает переписку, иначе список без выбора. */
export function ChatsRoute() {
  const [params] = useSearchParams();
  const { session } = useSession();
  return (
    <ChatPage
      initialChatId={chatIdFromQuery(params.get("chat"))}
      accountPhotoUrl={session?.photoUrl}
    />
  );
}
