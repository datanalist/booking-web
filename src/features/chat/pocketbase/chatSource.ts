import type { ChatMessage } from "../domain/ChatMessage";
import type { ChatThread } from "../domain/ChatThread";
import type { ConversationHeading } from "../domain/ConversationHeading";

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
};
