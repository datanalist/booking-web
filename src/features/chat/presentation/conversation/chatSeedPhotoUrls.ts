import { chatPhotoUrl, type ChatPhotoUrl } from "../../domain/ChatPhoto";
import type { ChatSeedPhotoUrls } from "../../data/chatMessageMocks";
import { chatAssets } from "../assets/chatAssets";

/** Адреса фото демо-переписок: сообщение у лифта и обложка жилья. */
export const chatSeedPhotoUrls: ChatSeedPhotoUrls = {
  message: mustPhotoUrl(chatAssets.messagePhoto),
  cover: mustPhotoUrl(chatAssets.listingCover),
};

function mustPhotoUrl(value: string): ChatPhotoUrl {
  const url = chatPhotoUrl(value);
  if (url === null) {
    throw new Error("Пустой адрес фото в сиде чата");
  }
  return url;
}
