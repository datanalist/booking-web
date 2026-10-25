import { SESSION_KEY } from "../../../api/keys";
import { createCabinetPbClient, resolveCabinetDataSource } from "../../../api/pocketbase";
import type { PbNotificationRecord } from "../../chat/pocketbase";
import { createPbNotificationSource } from "./createPbNotificationSource";

const EMPTY: readonly PbNotificationRecord[] = [];

let generation = 0;
let records: readonly PbNotificationRecord[] | null = null;
let loadedUserId: string | null = null;
let inflight: Promise<void> | null = null;
const pendingReads = new Set<string>();
const listeners = new Set<() => void>();

export function getNotificationRecords(): readonly PbNotificationRecord[] | null {
  if (resolveCabinetDataSource() !== "pocketbase" || readSessionUserId() === null) {
    return EMPTY;
  }
  if (loadedUserId !== readSessionUserId()) {
    return null;
  }
  return records;
}

export function subscribeNotificationRecords(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      resetNotificationInbox();
    }
  };
}

export function ensureNotificationInbox(): void {
  if (resolveCabinetDataSource() !== "pocketbase") {
    return;
  }
  const userId = readSessionUserId();
  if (userId === null || loadedUserId === userId || inflight !== null) {
    return;
  }
  const generationAtStart = generation;
  inflight = createPbNotificationSource(createCabinetPbClient())
    .list(userId)
    .then((items) => {
      if (generationAtStart !== generation) {
        return;
      }
      records = items;
      loadedUserId = userId;
      emit();
    })
    .catch(() => {
      if (generationAtStart !== generation) {
        return;
      }
      records = EMPTY;
      loadedUserId = userId;
      emit();
    })
    .finally(() => {
      if (generationAtStart === generation) {
        inflight = null;
      }
    });
}

export async function markNotificationRead(id: string): Promise<void> {
  const current = records;
  if (current === null || loadedUserId === null || pendingReads.has(id)) {
    return;
  }
  const target = current.find((item) => item.id === id);
  if (target === undefined || target.read === true) {
    return;
  }
  pendingReads.add(id);
  const generationAtStart = generation;
  try {
    await createPbNotificationSource(createCabinetPbClient()).markRead(id);
    if (generationAtStart !== generation || records === null) {
      return;
    }
    const stillUnread = records.some((item) => item.id === id && item.read !== true);
    if (!stillUnread) {
      return;
    }
    records = records.map((item) => (item.id === id ? { ...item, read: true } : item));
    emit();
  } finally {
    pendingReads.delete(id);
  }
}

function resetNotificationInbox(): void {
  generation += 1;
  records = null;
  loadedUserId = null;
  inflight = null;
  pendingReads.clear();
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readSessionUserId(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const userId = Reflect.get(parsed, "userId");
    return typeof userId === "string" && userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}
