import { createPbClient, resolvePocketBaseUrl } from "./pbClient";
import type { PbClient } from "./pbClient";

export const PB_TOKEN_KEY = "gs.pb.token";

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

export function createCabinetPbClient(storage: Storage = localStorage): PbClient {
  return createPbClient({
    baseUrl: resolvePocketBaseUrl(),
    token: () => readPbToken(storage),
  });
}
