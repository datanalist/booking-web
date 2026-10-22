import type { PhotoChatMessage } from "../../domain/ChatMessage";
import { chatPhotoFrameClass } from "./chatPhotoFrameClass";

export function ChatPhotoBubble({ message }: { message: PhotoChatMessage }) {
  return (
    <div className={chatPhotoFrameClass(message.author, message.receipt)} data-receipt={message.receipt}>
      {message.author === "peer" && message.receipt === "unread" ? (
        <span className="sr-only">Непрочитано</span>
      ) : null}
      <img
        src={message.photo.url}
        alt={message.photo.alt}
        className="absolute inset-0 size-full object-cover"
      />
      <time
        className="relative z-10 text-[12px] font-normal leading-[1.5] text-white"
        dateTime={message.timeLabel}
      >
        {message.timeLabel}
      </time>
    </div>
  );
}
