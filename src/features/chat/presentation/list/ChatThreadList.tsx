import type { ChatId } from "../../domain/ChatId";
import type { ChatThread } from "../../domain/ChatThread";
import { ChatListItem } from "./ChatListItem";

type ChatThreadListProps = {
  threads: readonly ChatThread[];
  selectedChatId: ChatId | null;
  onSelectChat: (chatId: ChatId) => void;
};

export function ChatThreadList({
  threads,
  selectedChatId,
  onSelectChat,
}: ChatThreadListProps) {
  if (threads.length === 0) {
    return (
      <p className="m-0 px-5 text-[14px] leading-[1.4] text-[#525353]">
        Ничего не найдено
      </p>
    );
  }

  return (
    <ul className="m-0 flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-0">
      {threads.map((thread) => (
        <ChatListItem
          key={thread.id}
          thread={thread}
          selected={thread.id === selectedChatId}
          onSelect={onSelectChat}
        />
      ))}
    </ul>
  );
}
