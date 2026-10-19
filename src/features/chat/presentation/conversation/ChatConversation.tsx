import type { ChatId } from "../../domain/ChatId";
import type { ChatMessage } from "../../domain/ChatMessage";
import type { ConversationHeading } from "../../domain/ConversationHeading";
import { ChatComposer } from "./ChatComposer";
import { ChatConversationHeader } from "./ChatConversationHeader";
import { ChatMessageList } from "./ChatMessageList";
import type { ComposerSend } from "./ComposerSend";
import { useOutgoingMessages } from "./useOutgoingMessages";

export type ChatConversationProps = {
  chatId: ChatId;
  heading: ConversationHeading;
  dateLabel: string;
  messages: readonly ChatMessage[];
  selfAvatarUrl: string;
  onSendMessage?: (draft: ComposerSend) => void;
};

export function ChatConversation({
  chatId,
  heading,
  dateLabel,
  messages,
  selfAvatarUrl,
  onSendMessage,
}: ChatConversationProps) {
  const outgoing = useOutgoingMessages();
  const thread = onSendMessage === undefined ? [...messages, ...outgoing.outgoing] : messages;

  return (
    <section
      data-chat-id={chatId}
      aria-label={`Переписка с ${heading.peerName}`}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white"
    >
      <ChatConversationHeader heading={heading} />
      <ChatMessageList
        dateLabel={dateLabel}
        messages={thread}
        selfAvatarUrl={selfAvatarUrl}
        peerAvatarUrl={heading.peerAvatarUrl}
      />
      <ChatComposer onSend={onSendMessage ?? outgoing.send} />
    </section>
  );
}
