import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SESSION_KEY } from "../../../api/keys";
import { createCabinetPbClient, resolveCabinetDataSource } from "../../../api/pocketbase";
import { CHAT_THREAD_MOCKS } from "../data/chatThreadMocks";
import type { ChatId } from "../domain/ChatId";
import type { ChatThread } from "../domain/ChatThread";
import { createPbChatSource, type ChatSource } from "../pocketbase";
import { OpenChatConversation } from "./conversation/OpenChatConversation";
import { DefaultChatScreen } from "./default/DefaultChatScreen";
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
  const [selectedChatId, setSelectedChatId] = useState<ChatId | null>(() =>
    openedChatId(threads ?? CHAT_THREAD_MOCKS, initialChatId),
  );

  useEffect(() => {
    if (source === null) {
      return;
    }
    if (hostId === null) {
      setLoadedThreads([]);
      return;
    }
    let cancelled = false;
    void source.listThreads(hostId).then(
      (loaded) => {
        if (!cancelled) {
          setLoadedThreads(loaded);
        }
      },
      () => {
        if (!cancelled) {
          setLoadedThreads([]);
        }
      },
    );
    return () => {
      cancelled = true;
    };
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

  const visibleThreads = threads ?? (live ? (loadedThreads ?? []) : CHAT_THREAD_MOCKS);
  const showThreads = threads !== undefined || !live || loadedThreads !== null;

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
            onSelectChat={setSelectedChatId}
            renderConversation={(chatId) =>
              renderOpenChat(chatId, source ?? undefined, hostId ?? undefined)
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
): ReactNode {
  return <OpenChatConversation chatId={chatId} source={source} hostId={hostId} />;
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
