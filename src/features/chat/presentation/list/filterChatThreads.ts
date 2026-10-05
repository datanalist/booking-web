import type { ChatThread } from "../../domain/ChatThread";

export function filterChatThreads(
  threads: readonly ChatThread[],
  query: string,
): readonly ChatThread[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return threads;
  }
  return threads.filter((thread) => matchesQuery(thread, normalized));
}

function matchesQuery(thread: ChatThread, normalized: string): boolean {
  return (
    thread.counterpartName.toLowerCase().includes(normalized) ||
    thread.preview.toLowerCase().includes(normalized)
  );
}
