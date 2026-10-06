import type { ConversationHeading } from "../../domain/ConversationHeading";
import { ChatConversationListing } from "./ChatConversationListing";

export function ChatConversationHeader({
  heading,
}: {
  heading: ConversationHeading;
}) {
  return (
    <header className="flex w-full items-center justify-between gap-3 border-b border-[rgba(251,192,40,0.17)] p-5">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={heading.peerAvatarUrl}
          alt=""
          className="size-11 shrink-0 rounded-full object-cover"
        />
        <p className="truncate text-[16px] font-bold leading-[1.2] text-[#1a1b1d]">
          {heading.peerName}
        </p>
      </div>
      {heading.kind === "listing" ? <ChatConversationListing heading={heading} /> : null}
    </header>
  );
}
