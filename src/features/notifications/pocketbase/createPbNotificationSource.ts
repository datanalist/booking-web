import type { PbClient } from "../../../api/pocketbase";
import type { PbNotificationRecord } from "../../chat/pocketbase";

const COLLECTION = "notifications";
const PER_PAGE = 200;

export type NotificationSource = {
  list(userId: string): Promise<readonly PbNotificationRecord[]>;
};

export function createPbNotificationSource(client: PbClient): NotificationSource {
  return {
    async list(userId: string): Promise<readonly PbNotificationRecord[]> {
      const query = {
        filter: `user="${userId}"`,
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
    },
  };
}
