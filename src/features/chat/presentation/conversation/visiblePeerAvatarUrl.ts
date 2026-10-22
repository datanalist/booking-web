import type { ConversationHeading } from "../../domain/ConversationHeading";
import { chatAssets } from "../assets/chatAssets";

const ACCOUNT_AVATAR_PLACEHOLDER = "/avatar-placeholder.png";

/** Пустой файл аккаунта не оставляет битую картинку: у поддержки свой значок, у гостя — заглушка. */
export function visiblePeerAvatarUrl(heading: ConversationHeading): string {
  const url = heading.peerAvatarUrl.trim();
  if (url.length > 0) {
    return url;
  }
  if (heading.kind === "direct") {
    return chatAssets.avatarSupport;
  }
  return ACCOUNT_AVATAR_PLACEHOLDER;
}
