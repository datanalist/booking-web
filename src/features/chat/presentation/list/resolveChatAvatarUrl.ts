import type { ChatAvatarKey } from "../../domain/ChatThread";
import { chatAssets } from "../assets/chatAssets";

const AVATAR_URL: Record<ChatAvatarKey, string> = {
  ekaterina: chatAssets.avatarEkaterina,
  ignat: chatAssets.avatarIgnat,
  anna: chatAssets.avatarAnna,
  ilya: chatAssets.avatarIlya,
};

export function resolveChatAvatarUrl(key: ChatAvatarKey): string {
  return AVATAR_URL[key];
}
