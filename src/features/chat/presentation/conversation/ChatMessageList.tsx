import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../domain/ChatMessage";
import { ChatDayLabel } from "./ChatDayLabel";
import { ChatMessageRow } from "./ChatMessageRow";
import { scrollThreadToEnd } from "./scrollThreadToEnd";

type ChatMessageListProps = {
  dateLabel: string;
  messages: readonly ChatMessage[];
  selfAvatarUrl: string;
  peerAvatarUrl: string;
};

export function ChatMessageList({
  dateLabel,
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
      className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-5"
      role="log"
      aria-label="Сообщения"
    >
      <div className="mt-auto flex w-full flex-col gap-8">
        <ChatDayLabel label={dateLabel} />
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
    </div>
  );
}
