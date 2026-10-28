import { useEffect, useRef, useState } from "react";
import { chatMessagesFromSeed } from "../../data/chatMessageMocks";
import { chatSeedById } from "../../data/chatSeeds";
import type { ChatId } from "../../domain/ChatId";
import type { ChatMessage } from "../../domain/ChatMessage";
import type { ChatSource, ChatConversationModel, ChatLiveNotice } from "../../pocketbase";
import { chatAssets } from "../assets/chatAssets";
import { ChatConversation } from "./ChatConversation";
import { chatSeedPhotoUrls } from "./chatSeedPhotoUrls";
import type { ComposerSend } from "./ComposerSend";
import { conversationSelfAvatarUrl } from "./conversationHeadingMock";
import { headingFromSeed } from "./headingFromSeed";
import { useOutgoingMessages } from "./useOutgoingMessages";

type OpenChatConversationProps = {
  chatId: ChatId;
  source?: ChatSource;
  hostId?: string;
  liveNotice?: ChatLiveNotice | null;
  accountPhotoUrl?: string;
};

type LiveChatConversationProps = {
  chatId: ChatId;
  source: ChatSource;
  hostId: string;
  liveNotice: ChatLiveNotice | null;
  accountPhotoUrl?: string;
};

/** Правая панель: переписка выбранного чата из сида или живого источника. */
export function OpenChatConversation({
  chatId,
  source,
  hostId,
  liveNotice = null,
  accountPhotoUrl,
}: OpenChatConversationProps) {
  if (source === undefined || hostId === undefined) {
    return <SeedChatConversation chatId={chatId} />;
  }
  return (
    <LiveChatConversation
      key={chatId}
      chatId={chatId}
      source={source}
      hostId={hostId}
      liveNotice={liveNotice}
      accountPhotoUrl={accountPhotoUrl}
    />
  );
}

/** Живой тред. key по chatId обнуляет модель и локальные исходящие до отрисовки. */
function LiveChatConversation({
  chatId,
  source,
  hostId,
  liveNotice,
  accountPhotoUrl,
}: LiveChatConversationProps) {
  const [model, setModel] = useState<ChatConversationModel | null>(null);
  const outgoing = useOutgoingMessages();
  const activeChatId = useRef(chatId);
  const pendingLive = useRef<readonly ChatMessage[]>([]);
  activeChatId.current = chatId;

  useEffect(() => {
    let cancelled = false;
    setModel(null);
    void source.loadConversation(chatId, hostId).then(
      (loaded) => {
        if (!cancelled) {
          setModel(appendMessages(loaded, pendingLive.current));
        }
        void source.markRead(chatId, hostId).catch(() => undefined);
      },
      () => {
        if (!cancelled) {
          setModel(null);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [chatId, hostId, source]);

  useEffect(() => {
    if (liveNotice === null || liveNotice.kind !== "message" || liveNotice.action !== "create") {
      return;
    }
    if (liveNotice.chatId !== chatId) {
      return;
    }
    pendingLive.current = mergeMessages(pendingLive.current, liveNotice.messages);
    setModel((current) => (current === null ? current : appendMessages(current, liveNotice.messages)));
    void source.markRead(chatId, hostId).catch(() => undefined);
  }, [chatId, hostId, liveNotice, source]);

  if (model === null) {
    return null;
  }
  return (
    <ChatConversation
      chatId={chatId}
      heading={model.heading}
      dateLabel={model.dateLabel}
      messages={[...model.messages, ...outgoing.outgoing]}
      selfAvatarUrl={accountAvatarUrl(accountPhotoUrl)}
      onSendMessage={(draft) => {
        sendLiveText(source, hostId, chatId, draft, activeChatId, setModel, outgoing.send);
      }}
    />
  );
}

function SeedChatConversation({ chatId }: { chatId: ChatId }) {
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

function accountAvatarUrl(photoUrl: string | undefined): string {
  const trimmed = photoUrl?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "/onboarding/avatar-placeholder.svg";
}

function appendMessages(
  model: ChatConversationModel,
  incoming: readonly ChatMessage[],
): ChatConversationModel {
  const messages = mergeMessages(model.messages, incoming);
  if (messages === model.messages) {
    return model;
  }
  return { ...model, messages };
}

function mergeMessages(
  current: readonly ChatMessage[],
  incoming: readonly ChatMessage[],
): readonly ChatMessage[] {
  const known = new Set(current.map((message) => message.id));
  const fresh = incoming.filter((message) => !known.has(message.id));
  if (fresh.length === 0) {
    return current;
  }
  return [...current, ...fresh];
}

function sendLiveText(
  source: ChatSource,
  hostId: string,
  chatId: ChatId,
  draft: ComposerSend,
  activeChatId: { current: ChatId },
  setModel: (model: ChatConversationModel) => void,
  appendOutgoing: (draft: ComposerSend) => void,
): void {
  if (draft.kind === "photo") {
    appendOutgoing(draft);
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
