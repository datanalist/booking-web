import { PbRequestError, type PbClient } from "../../../api/pocketbase";
import type { PbChatRecord } from "./pbChatTypes";

/** Учётка «Поддержка». Поле staff, если правило создания её принимает. */
export const SUPPORT_STAFF_USER_ID = "khyptzyfmyb4uzm";

/**
 * Один чат поддержки на хозяина: уже существующий `kind=support` с этим `host`
 * или новая запись, которую список кабинета видит по тому же полю.
 */
export async function resolveSupportChatId(client: PbClient, userId: string): Promise<string> {
  const hostId = userId.trim();
  if (hostId.length === 0) {
    throw new Error("Нет пользователя для чата поддержки");
  }
  const existing = await findHostSupportChat(client, hostId);
  if (existing !== null) {
    return existing;
  }
  return createHostSupportChat(client, hostId);
}

async function findHostSupportChat(client: PbClient, hostId: string): Promise<string | null> {
  const listed = await client.listRecords<PbChatRecord>("chats", {
    filter: `host="${quoteFilter(hostId)}" && kind="support"`,
    sort: "created",
    perPage: 1,
  });
  const id = listed.items[0]?.id.trim() ?? "";
  return id.length > 0 ? id : null;
}

async function createHostSupportChat(client: PbClient, hostId: string): Promise<string> {
  const raced = await findHostSupportChat(client, hostId);
  if (raced !== null) {
    return raced;
  }
  try {
    return readCreatedId(
      await client.createRecord<PbChatRecord>("chats", supportPayload(hostId, true)),
    );
  } catch (error) {
    const afterFailure = await findHostSupportChat(client, hostId);
    if (afterFailure !== null) {
      return afterFailure;
    }
    if (!(error instanceof PbRequestError) || error.status !== 400) {
      throw error;
    }
    return readCreatedId(
      await client.createRecord<PbChatRecord>("chats", supportPayload(hostId, false)),
    );
  }
}

function supportPayload(hostId: string, withStaff: boolean): {
  kind: "support";
  guest: string;
  host: string;
  staff?: string;
} {
  return {
    kind: "support",
    guest: hostId,
    host: hostId,
    ...(withStaff ? { staff: SUPPORT_STAFF_USER_ID } : {}),
  };
}

function readCreatedId(record: PbChatRecord): string {
  const id = record.id.trim();
  if (id.length === 0) {
    throw new Error("Чат поддержки создан без id");
  }
  return id;
}

function quoteFilter(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
