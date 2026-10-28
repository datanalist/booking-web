import { expect, test } from "vitest";
import { chatId } from "../../domain/ChatId";
import { chatClockLabel, type ChatThread } from "../../domain/ChatThread";
import { chatAssets } from "../assets/chatAssets";
import { chatThreadAvatarSrc } from "./chatThreadAvatarSrc";

function thread(patch: Partial<ChatThread>): ChatThread {
  return {
    id: chatId("chat-1"),
    counterpartName: "Анна",
    counterpartRole: "guest",
    avatarKey: "ekaterina",
    preview: "Привет",
    sentAt: chatClockLabel("13:21"),
    unread: { status: "none" },
    ...patch,
  };
}

test("живой чат показывает файл аккаунта, пустой и стоковый — заглушку, макет — свой ключ", () => {
  expect(
    chatThreadAvatarSrc(thread({ avatarUrl: "https://pb.example/api/files/users/g1/anna.jpg" })),
  ).toBe("https://pb.example/api/files/users/g1/anna.jpg");
  expect(chatThreadAvatarSrc(thread({ avatarUrl: "/bookings/guest-anna.jpg" }))).toBe(
    "/bookings/guest-anna.jpg",
  );
  expect(chatThreadAvatarSrc(thread({ avatarUrl: "" }))).toBe("/onboarding/avatar-placeholder.svg");
  expect(
    chatThreadAvatarSrc(thread({
      avatarUrl: "https://pb.example/api/files/users/g1/avatar-placeholder.png",
    })),
  ).toBe("/onboarding/avatar-placeholder.svg");
  expect(chatThreadAvatarSrc(thread({ counterpartRole: "support", avatarUrl: "  " }))).toBe(
    chatAssets.avatarSupport,
  );
  expect(
    chatThreadAvatarSrc(thread({
      counterpartRole: "support",
      avatarUrl: "/avatar-placeholder.png",
    })),
  ).toBe(chatAssets.avatarSupport);
  expect(chatThreadAvatarSrc(thread({ avatarKey: "anna" }))).toBe(chatAssets.avatarAnna);
});
