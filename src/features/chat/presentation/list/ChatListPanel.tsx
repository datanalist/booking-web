import { useState } from "react";
import type { ChatId } from "../../domain/ChatId";
import type { ChatThread } from "../../domain/ChatThread";
import { ChatListSearch } from "./ChatListSearch";
import { ChatThreadList } from "./ChatThreadList";
import { filterChatThreads } from "./filterChatThreads";

type ChatListPanelProps = {
  threads: readonly ChatThread[];
  selectedChatId: ChatId | null;
  onSelectChat: (chatId: ChatId) => void;
};

export function ChatListPanel({
  threads,
  selectedChatId,
  onSelectChat,
}: ChatListPanelProps) {
  const [query, setQuery] = useState("");
  const visible = filterChatThreads(threads, query);

  return (
    <section
      aria-label="Список чатов"
      className="flex h-full w-[437px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white"
    >
      <div className="px-5 pt-5 pb-6">
        <ChatListSearch value={query} onChange={setQuery} />
      </div>
      <ChatThreadList
        threads={visible}
        selectedChatId={selectedChatId}
        onSelectChat={onSelectChat}
      />
    </section>
  );
}
