import type { ConversationHeading } from "../../domain/ConversationHeading";
import { ChatMetaDot } from "./ChatMetaDot";

type ChatListingMetaProps = Pick<
  ConversationHeading,
  "city" | "datesLabel" | "guestsLabel"
>;

export function ChatListingMeta({
  city,
  datesLabel,
  guestsLabel,
}: ChatListingMetaProps) {
  return (
    <div className="flex items-center gap-1 text-[14px] font-normal leading-[1.4] text-[#525353]">
      <span>{city}</span>
      <ChatMetaDot />
      <span>{datesLabel}</span>
      <ChatMetaDot />
      <span>{guestsLabel}</span>
    </div>
  );
}
