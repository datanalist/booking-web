import { chatClockLabel, unreadCount, type ChatThread } from "../domain/ChatThread";
import { CHAT_SEEDS } from "./chatSeeds";
import { chatSeedTurns, type ChatSeed } from "./defineChatSeed";

/** Строки списка: превью, время и бейдж берутся из сида переписки. */
export const CHAT_THREAD_MOCKS: readonly ChatThread[] = CHAT_SEEDS.map(threadFromSeed);

function threadFromSeed(seed: ChatSeed): ChatThread {
  const unread = chatSeedTurns(seed).filter((turn) => turn.receipt === "unread").length;
  return {
    id: seed.id,
    counterpartName: seed.counterpartName,
    counterpartRole: seed.counterpartRole,
    avatarKey: seed.avatarKey,
    preview: seed.last.body,
    sentAt: chatClockLabel(seed.listedAt),
    unread:
      unread === 0
        ? { status: "none" }
        : { status: "unread", count: unreadCount(unread) },
  };
}
