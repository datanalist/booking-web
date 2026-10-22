import { expect, test } from "vitest";
import { chatPhotoUrl, type ChatPhotoUrl } from "../domain/ChatPhoto";
import { chatMessagesFromSeed } from "./chatMessageMocks";
import { CHAT_THREAD_MOCKS } from "./chatThreadMocks";
import { CHAT_SEEDS } from "./chatSeeds";
import { chatSeedTurns } from "./defineChatSeed";

const PHOTO_URLS = {
  message: mustUrl("https://example.test/message.png"),
  cover: mustUrl("https://example.test/cover.png"),
};

test("сид согласован: уникальные id, переписка у каждого чата, бейдж равен непрочитанным", () => {
  const chatIds = new Set<string>();
  const messageIds = new Set<string>();
  expect(CHAT_THREAD_MOCKS).toHaveLength(CHAT_SEEDS.length);

  for (const seed of CHAT_SEEDS) {
    expect(chatIds.has(seed.id)).toBe(false);
    chatIds.add(seed.id);
    const turns = chatSeedTurns(seed);
    expect(turns.length).toBeGreaterThanOrEqual(3);
    expect(turns.length).toBeLessThanOrEqual(8);
    for (const turn of turns) {
      expect(messageIds.has(turn.id)).toBe(false);
      messageIds.add(turn.id);
    }
    const thread = CHAT_THREAD_MOCKS.find((item) => item.id === seed.id);
    expect(thread?.preview).toBe(seed.last.body);
    expect(thread?.sentAt).toBe(seed.listedAt);
    expect(thread?.unread).toEqual(expectedUnread(turns));
  }

  const withPhoto = CHAT_SEEDS.filter((seed) =>
    chatSeedTurns(seed).some((turn) => turn.kind === "photo"),
  );
  expect(withPhoto.length).toBeGreaterThanOrEqual(1);
  expect(withPhoto.length).toBeLessThanOrEqual(2);
});

test("фото-сообщения берут слот ассета, а не отдельный адрес", () => {
  const ekaterina = CHAT_SEEDS.find((seed) => seed.avatarKey === "ekaterina");
  const anna = CHAT_SEEDS.find((seed) => seed.avatarKey === "anna");
  if (ekaterina === undefined || anna === undefined) {
    throw new Error("В сиде нет чатов с фото");
  }
  const ekaterinaPhoto = chatMessagesFromSeed(ekaterina, PHOTO_URLS).find(
    (message) => message.kind === "photo",
  );
  const annaPhoto = chatMessagesFromSeed(anna, PHOTO_URLS).find(
    (message) => message.kind === "photo",
  );
  expect(ekaterinaPhoto?.kind).toBe("photo");
  expect(annaPhoto?.kind).toBe("photo");
  if (ekaterinaPhoto?.kind !== "photo" || annaPhoto?.kind !== "photo") {
    throw new Error("В переписке нет фото");
  }
  expect(ekaterinaPhoto.photo.url).toBe(PHOTO_URLS.message);
  expect(ekaterinaPhoto.photo.alt).toBe("Фото помещения у лифта");
  expect(annaPhoto.photo.url).toBe(PHOTO_URLS.cover);
  expect(annaPhoto.photo.alt).toBe("Двор дома");
});

test("непрочитанные реплики сида остаются непрочитанными в ленте", () => {
  const ekaterina = CHAT_SEEDS.find((seed) => seed.avatarKey === "ekaterina");
  if (ekaterina === undefined) {
    throw new Error("В сиде нет чата Екатерины");
  }
  const messages = chatMessagesFromSeed(ekaterina, PHOTO_URLS);
  const unread = messages.filter((message) => message.receipt === "unread");
  expect(unread.map((message) => (message.kind === "text" ? message.body : ""))).toEqual([
    "Оплату перевела, чек придёт следом",
    "Добрый день, бронирование оплачено",
  ]);
  expect(messages.filter((message) => message.receipt === "read").length).toBe(messages.length - 2);
});

function expectedUnread(turns: ReturnType<typeof chatSeedTurns>) {
  const count = turns.filter((turn) => turn.receipt === "unread").length;
  if (count === 0) {
    return { status: "none" } as const;
  }
  return { status: "unread", count } as const;
}

function mustUrl(value: string): ChatPhotoUrl {
  const url = chatPhotoUrl(value);
  if (url === null) {
    throw new Error("Пустой тестовый адрес фото");
  }
  return url;
}
