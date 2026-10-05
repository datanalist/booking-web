import type { ConversationHeading } from "../../domain/ConversationHeading";
import { chatAssets } from "../assets/chatAssets";

export const conversationHeadingMock: ConversationHeading = {
  peerName: "Екатерина Кондратьева",
  peerAvatarUrl: chatAssets.guestMessageAvatar,
  listingTitle: "Уютная студия в центре Москвы",
  city: "Москва",
  datesLabel: "12.09.24 - 15.09.24",
  guestsLabel: "4 гостя",
  listingThumbUrl: chatAssets.listingThumbnail,
};

export const conversationSelfAvatarUrl = chatAssets.moderatorAvatar;

export const conversationDateLabel = "10 сентября";
