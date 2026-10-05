import type { ConversationHeading } from "../../domain/ConversationHeading";
import { ChatListingMeta } from "./ChatListingMeta";

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
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex flex-col items-end gap-0.5">
          <p className="text-[16px] font-bold leading-[1.2] text-[#1a1b1d]">
            {heading.listingTitle}
          </p>
          <ChatListingMeta
            city={heading.city}
            datesLabel={heading.datesLabel}
            guestsLabel={heading.guestsLabel}
          />
        </div>
        <img
          src={heading.listingThumbUrl}
          alt=""
          className="size-11 shrink-0 rounded-lg bg-[#eff2f6] object-cover"
        />
      </div>
    </header>
  );
}
