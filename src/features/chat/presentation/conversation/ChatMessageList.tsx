import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../domain/ChatMessage";
import { ChatMessageRow } from "./ChatMessageRow";
import { scrollThreadToEnd } from "./scrollThreadToEnd";

type ChatMessageListProps = {
  messages: readonly ChatMessage[];
  selfAvatarUrl: string;
  peerAvatarUrl: string;
};

export function ChatMessageList({
  messages,
  selfAvatarUrl,
  peerAvatarUrl,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollThreadToEnd(bottomRef.current);
  }, [messages.length]);

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col gap-8 overflow-y-auto px-5"
      role="log"
      aria-label="Сообщения"
    >
      {messages.map((message) => (
        <ChatMessageRow
          key={message.id}
          message={message}
          selfAvatarUrl={selfAvatarUrl}
          peerAvatarUrl={peerAvatarUrl}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
