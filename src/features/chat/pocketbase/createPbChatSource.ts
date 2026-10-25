import type { PbClient } from "../../../api/pocketbase";
import { createPbNotificationSource } from "../../notifications/pocketbase/createPbNotificationSource";
import { applyChatNotificationsRead } from "../../notifications/pocketbase/notificationInboxStore";
import {
  buildPbMarkChatReadPayload,
  buildPbSendMessagePayload,
  pbChatToHeading,
  pbChatToThread,
  pbMessageToChatMessage,
} from "./pbChatMapper";
import { noticeFromRealtime } from "./chatLiveNotice";
import { openChatRealtime } from "./openChatRealtime";
import type { PbChatRecord, PbMessageRecord } from "./pbChatTypes";
import type { ChatSource } from "./chatSource";

const CHAT_EXPAND = "guest,listing,booking,staff";

const dayMonth = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

export function createPbChatSource(client: PbClient): ChatSource {
  return {
    async listThreads(hostId) {
      const chats = await client.listRecords<PbChatRecord>("chats", {
        filter: `host="${hostId}"`,
        expand: CHAT_EXPAND,
        sort: "-last_message_at",
        perPage: 50,
      });
      if (chats.items.length === 0) {
        return [];
      }
      const filter = chats.items.map((chat) => `chat = "${chat.id}"`).join(" || ");
      const messages = await client.listRecords<PbMessageRecord>("messages", {
        filter,
        perPage: 200,
        sort: "-created",
      });
      const grouped = groupMessages(messages.items);
      return orderByLastMessage(chats.items).map((chat) =>
        pbChatToThread(chat, grouped.get(chat.id) ?? [], hostId, client.baseUrl),
      );
    },

    async loadConversation(chatId, hostId) {
      const chat = await loadChat(client, chatId);
      const messages = await client.listRecords<PbMessageRecord>("messages", {
        filter: `chat="${chatId}"`,
        sort: "created",
        perPage: 50,
      });
      return {
        heading: pbChatToHeading(chat, client.baseUrl),
        messages: messages.items.flatMap((message) =>
          pbMessageToChatMessage(message, hostId, client.baseUrl, chat.host_last_read ?? ""),
        ),
        dateLabel: dayMonthLabel(chat.created),
      };
    },

    async sendText(chatId, hostId, text) {
      await client.createRecord(
        "messages",
        buildPbSendMessagePayload({
          chatId,
          authorId: hostId,
          send: { kind: "text", body: text },
        }),
      );
    },

    async markRead(chatId, hostId) {
      await client.updateRecord(
        "chats",
        chatId,
        buildPbMarkChatReadPayload(new Date().toISOString()),
      );
      await createPbNotificationSource(client).markChatRead(hostId, chatId);
      applyChatNotificationsRead(chatId, hostId);
    },

    watchInbox(hostId, onNotice) {
      let seq = 0;
      return openChatRealtime({
        url: `${client.baseUrl}/api/realtime`,
        topics: ["messages", "chats"],
        subscribe: async (clientId) => {
          await client.post("/api/realtime", {
            clientId,
            subscriptions: ["messages", "chats"],
          });
        },
        onData: (topic, data) => {
          const notice = noticeFromRealtime(topic, data, hostId, client.baseUrl, () => {
            seq += 1;
            return seq;
          });
          if (notice !== null) {
            onNotice(notice);
          }
        },
      });
    },
  };
}

/**
 * `PbClient.getRecord` не принимает expand.
 * Чат открытой переписки читается списком с тем же expand, что и `listThreads`.
 */
async function loadChat(client: PbClient, chatId: string): Promise<PbChatRecord> {
  const listed = await client.listRecords<PbChatRecord>("chats", {
    filter: `id="${chatId}"`,
    expand: CHAT_EXPAND,
    perPage: 1,
  });
  const chat = listed.items[0];
  if (chat === undefined) {
    throw new Error("Чат не найден");
  }
  return chat;
}

/** Порядок списка — время последнего сообщения. Правка записи при прочтении его не двигает. */
function orderByLastMessage(chats: readonly PbChatRecord[]): PbChatRecord[] {
  return [...chats].sort((left, right) => lastMessageInstant(right) - lastMessageInstant(left));
}

function lastMessageInstant(chat: PbChatRecord): number {
  const raw = chat.last_message_at?.trim() ?? "";
  if (raw.length === 0) {
    return 0;
  }
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const time = Date.parse(normalized);
  return Number.isNaN(time) ? 0 : time;
}

function groupMessages(
  messages: readonly PbMessageRecord[],
): ReadonlyMap<string, PbMessageRecord[]> {
  const grouped = new Map<string, PbMessageRecord[]>();
  for (const message of messages) {
    const existing = grouped.get(message.chat);
    if (existing === undefined) {
      grouped.set(message.chat, [message]);
    } else {
      existing.push(message);
    }
  }
  return grouped;
}

function dayMonthLabel(created: string | undefined): string {
  if (created === undefined || created.trim().length === 0) {
    return "";
  }
  const normalized = created.includes("T") ? created : created.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return dayMonth.format(date);
}
