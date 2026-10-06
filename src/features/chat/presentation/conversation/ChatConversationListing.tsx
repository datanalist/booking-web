import type { ListingConversationHeading } from "../../domain/ConversationHeading";
import { ChatListingMeta } from "./ChatListingMeta";

/** Правый блок шапки гостевого чата: название жилья и миниатюра. */
export function ChatConversationListing({
  heading,
}: {
  heading: ListingConversationHeading;
}) {
  return (
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
  );
}
