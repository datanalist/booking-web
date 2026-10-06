import { ChatMetaDot } from "./ChatMetaDot";

type ChatListingMetaProps = {
  city: string;
  datesLabel: string;
  guestsLabel: string;
};

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
