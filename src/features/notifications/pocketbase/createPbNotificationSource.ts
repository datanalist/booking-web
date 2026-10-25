import type { PbClient } from "../../../api/pocketbase";
import type { PbNotificationRecord } from "../../chat/pocketbase/pbChatTypes";

const COLLECTION = "notifications";
const PER_PAGE = 200;

export type NotificationSource = {
  list(userId: string): Promise<readonly PbNotificationRecord[]>;
  markRead(id: string): Promise<PbNotificationRecord>;
  /** Ставит `read: true` непрочитанным уведомлениям хозяина по чату. Чат не меняет. */
  markChatRead(userId: string, chatId: string): Promise<void>;
};

export function createPbNotificationSource(client: PbClient): NotificationSource {
  return {
    list(userId: string): Promise<readonly PbNotificationRecord[]> {
      return listAll(client, `user="${userId}"`);
    },
    markRead(id: string): Promise<PbNotificationRecord> {
      return client.updateRecord<PbNotificationRecord>(COLLECTION, id, { read: true });
    },
    async markChatRead(userId: string, chatId: string): Promise<void> {
      const unread = await listAll(
        client,
        `user="${userId}" && chat="${chatId}" && read != true`,
      );
      const failures: unknown[] = [];
      for (const item of unread) {
        try {
          await client.updateRecord<PbNotificationRecord>(COLLECTION, item.id, { read: true });
        } catch (error) {
          failures.push(error);
        }
      }
      if (failures.length > 0) {
        console.error("Не удалось снять уведомления прочитанного чата", failures);
        throw new Error("Не удалось снять уведомления прочитанного чата");
      }
    },
  };
}

async function listAll(
  client: PbClient,
  filter: string,
): Promise<readonly PbNotificationRecord[]> {
  const query = {
    filter,
    sort: "-created",
    perPage: PER_PAGE,
  };
  const first = await client.listRecords<PbNotificationRecord>(COLLECTION, {
    ...query,
    page: 1,
  });
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await client.listRecords<PbNotificationRecord>(COLLECTION, {
      ...query,
      page,
    });
    items.push(...next.items);
  }
  return items;
}
