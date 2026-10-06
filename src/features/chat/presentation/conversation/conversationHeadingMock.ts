import { chatSeedById } from "../../data/chatSeeds";
import { chatId } from "../../domain/ChatId";
import { chatAssets } from "../assets/chatAssets";
import { headingFromSeed } from "./headingFromSeed";

const ekaterina = chatSeedById(chatId("chat-ekaterina"));
if (ekaterina === undefined) {
  throw new Error("В сиде нет чата Екатерины");
}

export const conversationHeadingMock = headingFromSeed(ekaterina);

export const conversationSelfAvatarUrl = chatAssets.moderatorAvatar;

export const conversationDateLabel = ekaterina.dateLabel;
