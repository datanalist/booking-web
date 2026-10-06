import { useState, type ReactNode } from "react";
import { CHAT_THREAD_MOCKS } from "../data/chatThreadMocks";
import type { ChatId } from "../domain/ChatId";
import type { ChatThread } from "../domain/ChatThread";
import { OpenChatConversation } from "./conversation/OpenChatConversation";
import { DefaultChatScreen } from "./default/DefaultChatScreen";
import { ChatsScreen } from "./list/ChatsScreen";

type ChatPageProps = {
  readonly threads?: readonly ChatThread[];
  readonly initialChatId?: ChatId | null;
};

export function ChatPage({
  threads = CHAT_THREAD_MOCKS,
  initialChatId = null,
}: ChatPageProps) {
  const [selectedChatId, setSelectedChatId] = useState<ChatId | null>(() =>
    openedChatId(threads, initialChatId),
  );

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <header className="flex h-10 w-full shrink-0 items-center">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Чаты
        </h1>
      </header>
      {threads.length === 0 ? (
        <DefaultChatScreen />
      ) : (
        <div className="flex min-h-0 w-full flex-1">
          <ChatsScreen
            threads={threads}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            renderConversation={renderOpenChat}
          />
        </div>
      )}
    </div>
  );
}

function renderOpenChat(chatId: ChatId): ReactNode {
  return <OpenChatConversation chatId={chatId} />;
}

function openedChatId(
  threads: readonly ChatThread[],
  initialChatId: ChatId | null,
): ChatId | null {
  if (initialChatId === null) {
    return null;
  }
  return threads.some((thread) => thread.id === initialChatId) ? initialChatId : null;
}
