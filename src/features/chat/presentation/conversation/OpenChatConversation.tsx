import { chatMessagesFromSeed } from "../../data/chatMessageMocks";
import { chatSeedById } from "../../data/chatSeeds";
import type { ChatId } from "../../domain/ChatId";
import { chatAssets } from "../assets/chatAssets";
import { ChatConversation } from "./ChatConversation";
import { chatSeedPhotoUrls } from "./chatSeedPhotoUrls";
import { conversationSelfAvatarUrl } from "./conversationHeadingMock";
import { headingFromSeed } from "./headingFromSeed";

/** Правая панель: переписка выбранного чата из общего сида. */
export function OpenChatConversation({ chatId }: { chatId: ChatId }) {
  const seed = chatSeedById(chatId);
  if (seed === undefined) {
    return null;
  }
  return (
    <ChatConversation
      chatId={seed.id}
      heading={headingFromSeed(seed)}
      dateLabel={seed.dateLabel}
      messages={chatMessagesFromSeed(seed, chatSeedPhotoUrls)}
      selfAvatarUrl={
        seed.counterpartRole === "support" ? chatAssets.avatarHost : conversationSelfAvatarUrl
      }
    />
  );
}
