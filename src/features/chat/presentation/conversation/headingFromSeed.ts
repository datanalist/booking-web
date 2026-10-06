import type { ChatSeed } from "../../data/defineChatSeed";
import type { ConversationHeading } from "../../domain/ConversationHeading";
import { chatAssets } from "../assets/chatAssets";
import { resolveChatAvatarUrl } from "../list/resolveChatAvatarUrl";

/** Шапка открытого чата из сида: имя и аватар собеседника не копируются отдельно. */
export function headingFromSeed(seed: ChatSeed): ConversationHeading {
  const peerName = seed.counterpartName;
  const peerAvatarUrl = resolveChatAvatarUrl(seed.avatarKey);
  if (seed.counterpartRole === "support") {
    return { kind: "direct", peerName, peerAvatarUrl };
  }
  return {
    kind: "listing",
    peerName,
    peerAvatarUrl,
    listingTitle: seed.listingTitle,
    city: seed.city,
    datesLabel: seed.datesLabel,
    guestsLabel: seed.guestsLabel,
    listingThumbUrl: chatAssets.listingThumbnail,
  };
}
