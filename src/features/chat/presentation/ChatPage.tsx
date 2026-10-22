import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SESSION_KEY } from "../../../api/keys";
import { createCabinetPbClient, resolveCabinetDataSource } from "../../../api/pocketbase";
import { CHAT_THREAD_MOCKS } from "../data/chatThreadMocks";
import type { ChatId } from "../domain/ChatId";
import type { ChatThread } from "../domain/ChatThread";
import { createPbChatSource, type ChatLiveNotice, type ChatSource } from "../pocketbase";
import { OpenChatConversation } from "./conversation/OpenChatConversation";
import { DefaultChatScreen } from "./default/DefaultChatScreen";
import { applyLiveMessage, clearChatUnread } from "./list/applyThreadInbox";
import { ChatsScreen } from "./list/ChatsScreen";

type ChatPageProps = {
  readonly threads?: readonly ChatThread[];
  readonly initialChatId?: ChatId | null;
};

export function ChatPage({ threads, initialChatId = null }: ChatPageProps) {
  const live = threads === undefined && resolveCabinetDataSource() === "pocketbase";
  const source = useMemo(
    () => (live ? createPbChatSource(createCabinetPbClient()) : null),
    [live],
  );
  const hostId = live ? readSessionUserId() : null;
  const [loadedThreads, setLoadedThreads] = useState<readonly ChatThread[] | null>(null);
  const [liveNotice, setLiveNotice] = useState<ChatLiveNotice | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<ChatId | null>(() =>
    openedChatId(threads ?? CHAT_THREAD_MOCKS, initialChatId),
  );
  const selectedRef = useRef(selectedChatId);
  selectedRef.current = selectedChatId;
  const threadsRef = useRef(loadedThreads);
  threadsRef.current = loadedThreads;
  const refreshGen = useRef(0);

  function refreshThreads(): void {
    if (source === null || hostId === null) {
      return;
    }
    const ticket = refreshGen.current + 1;
    refreshGen.current = ticket;
    void source.listThreads(hostId).then(
      (loaded) => {
        if (ticket !== refreshGen.current) {
          return;
        }
        setLoadedThreads(clearChatUnread(loaded, selectedRef.current));
      },
      () => {
        if (ticket !== refreshGen.current) {
          return;
        }
        setLoadedThreads([]);
      },
    );
  }

  useEffect(() => {
    if (source === null) {
      return;
    }
    if (hostId === null) {
      setLoadedThreads([]);
      return;
    }
    refreshThreads();
  }, [hostId, source]);

  useEffect(() => {
    if (source === null || hostId === null || source.watchInbox === undefined) {
      return;
    }
    return source.watchInbox(hostId, (notice) => {
      if (notice.kind === "message" && notice.action === "create") {
        setLiveNotice(notice);
        const known = threadsRef.current?.some((thread) => thread.id === notice.chatId) ?? false;
        setLoadedThreads((current) =>
          current === null
            ? current
            : applyLiveMessage(current, {
                chatId: notice.chatId,
                preview: notice.preview,
                sentAt: notice.sentAt,
                incoming: notice.incoming,
                chatIsOpen: selectedRef.current === notice.chatId,
              }),
        );
        if (known) {
          return;
        }
      }
      refreshThreads();
    });
  }, [hostId, source]);

  useEffect(() => {
    if (loadedThreads === null) {
      return;
    }
    setSelectedChatId((current) => {
      if (current !== null && loadedThreads.some((thread) => thread.id === current)) {
        return current;
      }
      return openedChatId(loadedThreads, initialChatId);
    });
  }, [initialChatId, loadedThreads]);

  const visibleThreads = clearChatUnread(
    threads ?? (live ? (loadedThreads ?? []) : CHAT_THREAD_MOCKS),
    selectedChatId,
  );
  const showThreads = threads !== undefined || !live || loadedThreads !== null;

  function selectChat(chatId: ChatId): void {
    selectedRef.current = chatId;
    setSelectedChatId(chatId);
    setLoadedThreads((current) => (current === null ? current : clearChatUnread(current, chatId)));
  }

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <header className="flex h-10 w-full shrink-0 items-center">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Чаты
        </h1>
      </header>
      {showThreads && visibleThreads.length === 0 ? <DefaultChatScreen /> : null}
      {showThreads && visibleThreads.length > 0 ? (
        <div className="flex min-h-0 w-full flex-1">
          <ChatsScreen
            threads={visibleThreads}
            selectedChatId={selectedChatId}
            onSelectChat={selectChat}
            renderConversation={(chatId) =>
              renderOpenChat(chatId, source ?? undefined, hostId ?? undefined, liveNotice)
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function renderOpenChat(
  chatId: ChatId,
  source: ChatSource | undefined,
  hostId: string | undefined,
  liveNotice: ChatLiveNotice | null,
): ReactNode {
  return (
    <OpenChatConversation
      chatId={chatId}
      source={source}
      hostId={hostId}
      liveNotice={liveNotice}
    />
  );
}

function openedChatId(
  threads: readonly ChatThread[],
  initialChatId: ChatId | null,
): ChatId | null {
  if (initialChatId === null) {
    return null;
  }
  return threads.some((thread) => thread.id === initialChatId) ? initialChatId : null;
}

function readSessionUserId(): string | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || !("userId" in parsed)) {
      return null;
    }
    const userId = parsed.userId;
    return typeof userId === "string" && userId.trim().length > 0 ? userId : null;
  } catch {
    return null;
  }
}
