import type { ReactNode } from "react";
import type { ChatMessage } from "../../domain/ChatMessage";
import type { MessageAuthor } from "../../domain/MessageAuthor";
import { ChatMessageAvatarSlot } from "./ChatMessageAvatarSlot";
import { ChatPhotoBubble } from "./ChatPhotoBubble";
import { ChatTextBubble } from "./ChatTextBubble";

type ChatMessageRowProps = {
  message: ChatMessage;
  selfAvatarUrl: string;
  peerAvatarUrl: string;
};

export function ChatMessageRow({
  message,
  selfAvatarUrl,
  peerAvatarUrl,
}: ChatMessageRowProps) {
  return (
    <div className={chatMessageRowClass(message.author)} data-author={message.author}>
      <div className="flex min-w-0 max-w-full items-end gap-4">
        <ChatMessageAvatarSlot
          author={message.author}
          slot="leading"
          selfAvatarUrl={selfAvatarUrl}
          peerAvatarUrl={peerAvatarUrl}
        />
        {chatMessageBody(message)}
        <ChatMessageAvatarSlot
          author={message.author}
          slot="trailing"
          selfAvatarUrl={selfAvatarUrl}
          peerAvatarUrl={peerAvatarUrl}
        />
      </div>
    </div>
  );
}

function chatMessageRowClass(author: MessageAuthor): string {
  switch (author) {
    case "self":
      return "flex w-full justify-end";
    case "peer":
      return "flex w-full justify-start";
  }
}

function chatMessageBody(message: ChatMessage): ReactNode {
  switch (message.kind) {
    case "text":
      return <ChatTextBubble message={message} />;
    case "photo":
      return <ChatPhotoBubble message={message} />;
  }
}
