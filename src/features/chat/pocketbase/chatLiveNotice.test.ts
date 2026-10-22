import { expect, test } from "vitest";
import { noticeFromRealtime } from "./chatLiveNotice";

test("создание чужого сообщения становится непрочитанным уведомлением", () => {
  let seq = 0;
  const notice = noticeFromRealtime(
    "messages",
    JSON.stringify({
      action: "create",
      record: {
        id: "ldlvjle3k1s2c5v",
        chat: "oxtkds00vnwqjxh",
        author: "guest-1",
        text: "Мы на месте",
        created: "2026-10-22T21:20:00.000Z",
      },
    }),
    "host-1",
    "https://pb.example",
    () => {
      seq += 1;
      return seq;
    },
  );
  expect(notice?.kind).toBe("message");
  if (notice?.kind !== "message") {
    return;
  }
  expect(notice.chatId).toBe("oxtkds00vnwqjxh");
  expect(notice.incoming).toBe(true);
  expect(notice.preview).toBe("Мы на месте");
  expect(notice.messages[0]).toMatchObject({ body: "Мы на месте", receipt: "unread", author: "peer" });
});

test("своё сообщение не входящее, событие чата без текста", () => {
  const own = noticeFromRealtime(
    "messages",
    JSON.stringify({
      action: "create",
      record: {
        id: "aaaaaaaaaaaaaaa",
        chat: "chat-1",
        author: "host-1",
        text: "Ждём",
        created: "2026-10-22T21:20:00.000Z",
      },
    }),
    "host-1",
    "https://pb.example",
    () => 1,
  );
  expect(own?.kind === "message" ? own.incoming : null).toBe(false);

  const chat = noticeFromRealtime(
    "chats",
    JSON.stringify({ action: "update", record: { id: "chat-1" } }),
    "host-1",
    "https://pb.example",
    () => 2,
  );
  expect(chat).toEqual({ seq: 2, kind: "chat", chatId: "chat-1" });
});
