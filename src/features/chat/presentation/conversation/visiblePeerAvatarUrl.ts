import { accountPhotoCandidate } from "../../../../ui/useAccountPhotoSrc";
import type { ConversationHeading } from "../../domain/ConversationHeading";
import { chatAssets } from "../assets/chatAssets";

const ACCOUNT_AVATAR_PLACEHOLDER = "/onboarding/avatar-placeholder.svg";

/** Пустой и стоковый файл не оставляют чужой портрет: у поддержки свой значок, у гостя — заглушка. */
export function visiblePeerAvatarUrl(heading: ConversationHeading): string {
  const candidate = accountPhotoCandidate(heading.peerAvatarUrl);
  if (candidate !== undefined) {
    return candidate;
  }
  if (heading.kind === "direct") {
    return chatAssets.avatarSupport;
  }
  return ACCOUNT_AVATAR_PLACEHOLDER;
}
