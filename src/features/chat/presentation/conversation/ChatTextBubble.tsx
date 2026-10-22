import type { TextChatMessage } from "../../domain/ChatMessage";
import { chatMessageBodyClass } from "./chatMessageBodyClass";
import { chatTextBubbleClass } from "./chatTextBubbleClass";

export function ChatTextBubble({ message }: { message: TextChatMessage }) {
  return (
    <div className={chatTextBubbleClass(message.author, message.receipt)} data-receipt={message.receipt}>
      {message.author === "peer" && message.receipt === "unread" ? (
        <span className="sr-only">Непрочитано</span>
      ) : null}
      <p className={chatMessageBodyClass}>{message.body}</p>
      <time
        className="text-[12px] font-normal leading-[1.5] text-[#525353]"
        dateTime={message.timeLabel}
      >
        {message.timeLabel}
      </time>
    </div>
  );
}
