import { useEffect, useRef, useState } from "react";
import { chatMessagesFromSeed } from "../../data/chatMessageMocks";
import { chatSeedById } from "../../data/chatSeeds";
import type { ChatId } from "../../domain/ChatId";
import type { ChatSource, ChatConversationModel } from "../../pocketbase";
import { chatAssets } from "../assets/chatAssets";
import { ChatConversation } from "./ChatConversation";
import { chatSeedPhotoUrls } from "./chatSeedPhotoUrls";
import type { ComposerSend } from "./ComposerSend";
import { conversationSelfAvatarUrl } from "./conversationHeadingMock";
import { headingFromSeed } from "./headingFromSeed";

type OpenChatConversationProps = {
  chatId: ChatId;
  source?: ChatSource;
  hostId?: string;
};

/** Правая панель: переписка выбранного чата из сида или живого источника. */
export function OpenChatConversation({ chatId, source, hostId }: OpenChatConversationProps) {
  const [model, setModel] = useState<ChatConversationModel | null>(null);
  const activeChatId = useRef(chatId);
  activeChatId.current = chatId;
  const live = source !== undefined && hostId !== undefined;

  useEffect(() => {
    if (!live || source === undefined || hostId === undefined) {
      return;
    }
    let cancelled = false;
    setModel(null);
    void source.loadConversation(chatId, hostId).then(
      (loaded) => {
        if (!cancelled) {
          setModel(loaded);
        }
      },
      () => {
        if (!cancelled) {
          setModel(null);
        }
      },
    );
    void source.markRead(chatId).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [chatId, hostId, live, source]);

  if (live && source !== undefined && hostId !== undefined) {
    if (model === null) {
      return null;
    }
    return (
      <ChatConversation
        chatId={chatId}
        heading={model.heading}
        dateLabel={model.dateLabel}
        messages={model.messages}
        selfAvatarUrl={
          model.heading.kind === "direct" ? chatAssets.avatarHost : conversationSelfAvatarUrl
        }
        onSendMessage={(draft) => {
          sendLiveText(source, hostId, chatId, draft, activeChatId, setModel);
        }}
      />
    );
  }

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

function sendLiveText(
  source: ChatSource,
  hostId: string,
  chatId: ChatId,
  draft: ComposerSend,
  activeChatId: { current: ChatId },
  setModel: (model: ChatConversationModel) => void,
): void {
  if (draft.kind !== "text") {
    return;
  }
  void source
    .sendText(chatId, hostId, draft.body)
    .then(async () => {
      const loaded = await source.loadConversation(chatId, hostId);
      if (activeChatId.current === chatId) {
        setModel(loaded);
      }
    })
    .catch(() => undefined);
}
