import type { ChatId } from "../domain/ChatId";
import type { ChatMessage } from "../domain/ChatMessage";
import type { ChatClockLabel, ChatThread } from "../domain/ChatThread";
import type { ConversationHeading } from "../domain/ConversationHeading";

/** Живое событие списка: новое сообщение или изменение чата. */
export type ChatLiveNotice = {
  readonly seq: number;
  readonly chatId: ChatId;
  readonly kind: "message";
  readonly action: "create" | "update" | "delete";
  readonly incoming: boolean;
  readonly preview: string;
  readonly sentAt: ChatClockLabel;
  readonly messages: readonly ChatMessage[];
} | {
  readonly seq: number;
  readonly chatId: ChatId;
  readonly kind: "chat";
};

export type ChatConversationModel = {
  heading: ConversationHeading;
  messages: readonly ChatMessage[];
  dateLabel: string;
};

export type ChatSource = {
  listThreads(hostId: string): Promise<readonly ChatThread[]>;
  loadConversation(chatId: string, hostId: string): Promise<ChatConversationModel>;
  sendText(chatId: string, hostId: string, text: string): Promise<void>;
  markRead(chatId: string): Promise<void>;
  watchInbox?(hostId: string, onNotice: (notice: ChatLiveNotice) => void): () => void;
};
