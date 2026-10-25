import { expect, test } from "vitest";
import { supportChatHref } from "./supportChatHref";

test("мок открывает сид поддержки", () => {
  expect(supportChatHref()).toBe("/chats?chat=chat-support");
});

test("живой id подставляется в тот же query", () => {
  expect(supportChatHref("gc134dxdyo7je7w")).toBe("/chats?chat=gc134dxdyo7je7w");
});
