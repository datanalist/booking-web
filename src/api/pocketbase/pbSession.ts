import { SESSION_KEY } from "../keys";
import type { Session } from "../types";
import { createPbClient, resolvePocketBaseUrl } from "./pbClient";
import type { PbClient } from "./pbClient";
import { isPbTokenExpired } from "./pbToken";

export const PB_TOKEN_KEY = "gs.pb.token";

const lostListeners = new Set<() => void>();

export function readPbToken(storage: Storage): string | null {
  const value = storage.getItem(PB_TOKEN_KEY);
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function writePbToken(storage: Storage, token: string): void {
  storage.setItem(PB_TOKEN_KEY, token);
}

export function clearPbToken(storage: Storage): void {
  storage.removeItem(PB_TOKEN_KEY);
}

export function onPbSessionLost(listener: () => void): () => void {
  lostListeners.add(listener);
  return () => {
    lostListeners.delete(listener);
  };
}

export function dropPbSession(storage: Storage): void {
  const hadAuth = storage.getItem(SESSION_KEY) !== null || readPbToken(storage) !== null;
  clearPbToken(storage);
  storage.removeItem(SESSION_KEY);
  if (!hadAuth) {
    return;
  }
  for (const listener of [...lostListeners]) {
    listener();
  }
}

export function readCabinetSession(storage: Storage): Session | null {
  const raw = storage.getItem(SESSION_KEY);
  if (raw === null) {
    return null;
  }
  const token = readPbToken(storage);
  if (token !== null && isPbTokenExpired(token)) {
    dropPbSession(storage);
    return null;
  }
  return JSON.parse(raw) as Session;
}

export function createCabinetPbClient(storage: Storage = localStorage): PbClient {
  return createPbClient({
    baseUrl: resolvePocketBaseUrl(),
    token: () => {
      const token = readPbToken(storage);
      if (token !== null && isPbTokenExpired(token)) {
        dropPbSession(storage);
        return null;
      }
      return token;
    },
    onUnauthorized: (sentToken) => {
      if (readPbToken(storage) === sentToken) {
        dropPbSession(storage);
      }
    },
  });
}
