import type { UnreadCount } from "../../domain/ChatThread";

type ChatUnreadBadgeProps = {
  count: UnreadCount;
};

export function ChatUnreadBadge({ count }: ChatUnreadBadgeProps) {
  return (
    <span
      role="status"
      aria-label={`Непрочитанных: ${count}`}
      className="absolute top-10 right-5 flex size-6 items-center justify-center rounded-[30px] bg-[#fbc028] text-[12px] leading-[1.2] font-bold text-white"
    >
      {count}
    </span>
  );
}
