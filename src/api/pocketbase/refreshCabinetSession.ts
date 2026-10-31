import { readUserRecord, writeSession } from "./pbAuthHelpers";
import { createCabinetPbClient, writePbToken } from "./pbSession";
import { pbUserToSession } from "./userMapper";
import type { Session } from "../types";

/** Перечитывает пользователя PocketBase и записывает баланс в сессию кабинета. */
export async function refreshCabinetSession(storage: Storage): Promise<Session> {
  const client = createCabinetPbClient(storage);
  const auth = await client.authRefresh();
  writePbToken(storage, auth.token);
  return writeSession(storage, pbUserToSession(readUserRecord(auth.record), client.baseUrl));
}
