import type { TextChatMessage } from "../../domain/ChatMessage";
import { chatMessageBodyClass } from "./chatMessageBodyClass";
import { chatTextBubbleClass } from "./chatTextBubbleClass";

export function ChatTextBubble({ message }: { message: TextChatMessage }) {
  return (
    <div className={chatTextBubbleClass(message.author)}>
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
