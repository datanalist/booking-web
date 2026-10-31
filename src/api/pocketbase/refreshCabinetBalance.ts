import type { Session } from "../types";
import { readSession, readUserRecord, writeSession } from "./pbAuthHelpers";
import { createCabinetPbClient } from "./pbSession";
import { pbUserToSession } from "./userMapper";

let epoch = 0;

/** Оплата увеличивает эпоху, чтобы медленный ответ не вернул старый баланс. */
export function bumpCabinetBalanceEpoch(): void {
  epoch += 1;
}

export function cabinetBalanceEpoch(): number {
  return epoch;
}

/** Читает `users.balance` и записывает его в сессию, не трогая остальные поля. */
export async function refreshCabinetBalance(
  storage: Storage,
  isCurrent: () => boolean = () => true,
): Promise<Session> {
  const seen = epoch;
  const client = createCabinetPbClient(storage);
  const current = readSession(storage);
  const raw: unknown = await client.getRecord("users", current.userId);
  const latest = readSession(storage);
  if (!isCurrent() || seen !== epoch || latest.userId !== current.userId) {
    return latest;
  }
  const fresh = pbUserToSession(readUserRecord(raw), client.baseUrl);
  if (fresh.userId !== latest.userId || typeof fresh.balance !== "number") {
    return latest;
  }
  return writeSession(storage, { ...latest, balance: fresh.balance });
}
