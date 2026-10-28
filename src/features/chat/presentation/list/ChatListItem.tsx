import { useVisibleAccountPhoto } from "../../../../ui/useAccountPhotoSrc";
import type { ChatId } from "../../domain/ChatId";
import type { ChatThread, UnreadCount } from "../../domain/ChatThread";
import { chatThreadAvatarSrc } from "./chatThreadAvatarSrc";
import { ChatUnreadBadge } from "./ChatUnreadBadge";

type ChatListItemProps = {
  thread: ChatThread;
  selected: boolean;
  onSelect: (chatId: ChatId) => void;
};

export function ChatListItem({ thread, selected, onSelect }: ChatListItemProps) {
  const avatarSrc = useVisibleAccountPhoto(chatThreadAvatarSrc(thread));
  const unread = selected ? null : visibleUnread(thread);
  const rowClass = selected
    ? "bg-[rgba(251,192,40,0.17)]"
    : "bg-white hover:bg-[rgba(251,192,40,0.04)]";

  return (
    <li className="border-b border-[rgba(251,192,40,0.17)]">
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(thread.id)}
        className={`relative flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left ${rowClass}`}
      >
        <img
          alt=""
          src={avatarSrc}
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-[16px] leading-[1.2] font-bold text-[#1a1b1d]">
              {thread.counterpartName}
            </span>
            <span className="shrink-0 text-right text-[14px] leading-[1.4] text-[#525353] opacity-80">
              {thread.sentAt}
            </span>
          </span>
          <span
            className={`truncate text-[14px] leading-[1.4] text-[#1a1b1d] ${unread === null ? "" : "pr-8"}`}
          >
            {thread.preview}
          </span>
        </span>
        {unread === null ? null : <ChatUnreadBadge count={unread} />}
      </button>
    </li>
  );
}

function visibleUnread(thread: ChatThread): UnreadCount | null {
  if (thread.unread.status === "none") {
    return null;
  }
  return thread.unread.count;
}
