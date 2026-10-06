import type { ReactNode } from "react";
import { CHAT_THREAD_MOCKS } from "../../data/chatThreadMocks";
import type { ChatId } from "../../domain/ChatId";
import type { ChatThread } from "../../domain/ChatThread";
import { ChatListPanel } from "./ChatListPanel";
import { ChatSelectPlaceholder } from "./ChatSelectPlaceholder";

export type ChatsScreenProps = {
  threads?: readonly ChatThread[];
  selectedChatId: ChatId | null;
  onSelectChat: (chatId: ChatId) => void;
  renderConversation?: (chatId: ChatId) => ReactNode;
};

export function ChatsScreen({
  threads = CHAT_THREAD_MOCKS,
  selectedChatId,
  onSelectChat,
  renderConversation,
}: ChatsScreenProps) {
  return (
    <div className="flex h-full min-h-0 w-full gap-8 font-sans">
      <ChatListPanel
        threads={threads}
        selectedChatId={selectedChatId}
        onSelectChat={onSelectChat}
      />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {rightPane(selectedChatId, renderConversation)}
      </div>
    </div>
  );
}

function rightPane(
  selectedChatId: ChatId | null,
  renderConversation: ChatsScreenProps["renderConversation"],
): ReactNode {
  if (selectedChatId === null || renderConversation === undefined) {
    return <ChatSelectPlaceholder />;
  }
  return renderConversation(selectedChatId);
}
