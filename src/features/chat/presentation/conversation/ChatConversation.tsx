import type { ChatMessage } from "../../domain/ChatMessage";
import type { ConversationHeading } from "../../domain/ConversationHeading";
import { ChatComposer } from "./ChatComposer";
import { ChatConversationHeader } from "./ChatConversationHeader";
import { ChatDayLabel } from "./ChatDayLabel";
import { ChatMessageList } from "./ChatMessageList";
import type { ConversationChatId } from "./ConversationChatId";
import { useOutgoingMessages } from "./useOutgoingMessages";

export type ChatConversationProps = {
  chatId: ConversationChatId;
  heading: ConversationHeading;
  dateLabel: string;
  messages: readonly ChatMessage[];
  selfAvatarUrl: string;
};

export function ChatConversation({
  chatId,
  heading,
  dateLabel,
  messages,
  selfAvatarUrl,
}: ChatConversationProps) {
  const outgoing = useOutgoingMessages();
  const thread = [...messages, ...outgoing.outgoing];

  return (
    <section
      data-chat-id={chatId}
      aria-label={`Переписка с ${heading.peerName}`}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white"
    >
      <ChatConversationHeader heading={heading} />
      <ChatDayLabel label={dateLabel} />
      <ChatMessageList
        messages={thread}
        selfAvatarUrl={selfAvatarUrl}
        peerAvatarUrl={heading.peerAvatarUrl}
      />
      <ChatComposer onSend={outgoing.send} />
    </section>
  );
}
