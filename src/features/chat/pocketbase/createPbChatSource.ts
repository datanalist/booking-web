import type { PbClient } from "../../../api/pocketbase";
import {
  buildPbMarkChatReadPayload,
  buildPbSendMessagePayload,
  pbChatToHeading,
  pbChatToThread,
  pbMessageToChatMessage,
} from "./pbChatMapper";
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
        sort: "-updated",
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
      return chats.items.map((chat) =>
        pbChatToThread(chat, grouped.get(chat.id) ?? [], hostId),
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
          pbMessageToChatMessage(message, hostId, client.baseUrl),
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

    async markRead(chatId) {
      await client.updateRecord(
        "chats",
        chatId,
        buildPbMarkChatReadPayload(new Date().toISOString()),
      );
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
