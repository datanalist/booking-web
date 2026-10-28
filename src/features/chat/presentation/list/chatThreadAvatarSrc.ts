import type { ChatThread } from "../../domain/ChatThread";
import { chatAssets } from "../assets/chatAssets";
import { resolveChatAvatarUrl } from "./resolveChatAvatarUrl";

const ACCOUNT_AVATAR_PLACEHOLDER = "/onboarding/avatar-placeholder.svg";

/** Аватар строки списка: файл аккаунта, иначе заглушка. Макет без `avatarUrl` оставляет свой портрет. */
export function chatThreadAvatarSrc(thread: ChatThread): string {
  if (thread.avatarUrl === undefined) {
    return resolveChatAvatarUrl(thread.avatarKey);
  }
  const url = thread.avatarUrl.trim();
  if (url.length > 0) {
    return url;
  }
  if (thread.counterpartRole === "support") {
    return chatAssets.avatarSupport;
  }
  return ACCOUNT_AVATAR_PLACEHOLDER;
}
