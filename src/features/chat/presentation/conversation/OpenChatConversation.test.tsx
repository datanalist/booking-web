import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { chatId } from "../../domain/ChatId";
import type { ChatMessage, MessageReceipt } from "../../domain/ChatMessage";
import { chatMessageId } from "../../domain/ChatMessageId";
import { messageTimeLabel } from "../../domain/MessageTimeLabel";
import { chatClockLabel } from "../../domain/ChatThread";
import type { ChatConversationModel, ChatLiveNotice, ChatSource } from "../../pocketbase";
import { OpenChatConversation } from "./OpenChatConversation";

function selfText(id: string, body: string): ChatMessage {
  const messageId = chatMessageId(id);
  const timeLabel = messageTimeLabel("10:07");
  if (messageId === null || timeLabel === null) {
    throw new Error("мок сообщения");
  }
  return { kind: "text", id: messageId, author: "self", timeLabel, body, receipt: "read" };
}

function peerText(id: string, body: string, receipt: MessageReceipt = "read"): ChatMessage {
  const messageId = chatMessageId(id);
  const timeLabel = messageTimeLabel("10:07");
  if (messageId === null || timeLabel === null) {
    throw new Error("мок сообщения");
  }
  return { kind: "text", id: messageId, author: "peer", timeLabel, body, receipt };
}

function conversation(
  peerName: string,
  body: string,
  messageId: string,
  receipt: MessageReceipt = "read",
): ChatConversationModel {
  return {
    heading: {
      kind: "direct",
      peerName,
      peerAvatarUrl: "https://example.test/peer.png",
    },
    dateLabel: "10 сентября",
    messages: [peerText(messageId, body, receipt)],
  };
}

function sourceFor(
  loadConversation: ChatSource["loadConversation"],
  sendText: ChatSource["sendText"] = async () => {},
): ChatSource {
  return {
    listThreads: async () => [],
    loadConversation,
    sendText,
    markRead: async () => {},
  };
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  let n = 0;
  URL.createObjectURL = () => {
    n += 1;
    return `blob:preview-${n}`;
  };
  URL.revokeObjectURL = vi.fn();
});

test("свой аватар в живом чате берётся из фото аккаунта", async () => {
  const loaded = conversation("Анна", "Первое сообщение", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  loaded.messages = [selfText("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "Мой ответ"), ...loaded.messages];
  const source = sourceFor(async () => loaded);
  render(
    <OpenChatConversation
      chatId={chatId("chat-a")}
      source={source}
      hostId="user1"
      accountPhotoUrl="https://pb.example/api/files/users/user1/me.jpg"
    />,
  );
  const mine = (await screen.findByText("Мой ответ")).closest("[data-author='self']");
  expect(mine?.querySelector("img")).toHaveAttribute(
    "src",
    "https://pb.example/api/files/users/user1/me.jpg",
  );
});

test("без фото аккаунта свой аватар — общая заглушка, не портрет из макета", async () => {
  const loaded = conversation("Анна", "Первое сообщение", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  loaded.messages = [selfText("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "Мой ответ"), ...loaded.messages];
  const source = sourceFor(async () => loaded);
  render(<OpenChatConversation chatId={chatId("chat-a")} source={source} hostId="user1" />);
  const mine = (await screen.findByText("Мой ответ")).closest("[data-author='self']");
  expect(mine?.querySelector("img")).toHaveAttribute("src", "/avatar-placeholder.png");
});

test("непрочитанное входящее подсвечивается, отметка прочтения — после загрузки", async () => {
  const order: string[] = [];
  let release: ((loaded: ChatConversationModel) => void) | null = null;
  const loaded = conversation(
    "Анна",
    "Новое сообщение",
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "unread",
  );
  const source = sourceFor(
    () =>
      new Promise((resolve) => {
        release = (model) => {
          order.push("load");
          resolve(model);
        };
      }),
  );
  source.markRead = async () => {
    order.push("read");
  };
  render(<OpenChatConversation chatId={chatId("chat-a")} source={source} hostId="user1" />);
  expect(order).toEqual([]);
  if (release === null) {
    throw new Error("загрузка чата не началась");
  }
  release(loaded);
  const unread = await screen.findByText("Новое сообщение");
  expect(unread.closest("[data-receipt]")?.className).toContain("bg-[rgba(251,192,40,0.35)]");
  await waitFor(() => {
    expect(order).toEqual(["load", "read"]);
  });
});

test("живое сообщение сразу появляется в открытой переписке", async () => {
  const markRead = vi.fn(async () => {});
  const source = sourceFor(
    async () => conversation("Анна", "Первое сообщение", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
  );
  source.markRead = markRead;
  const notice: ChatLiveNotice = {
    seq: 1,
    kind: "message",
    action: "create",
    chatId: chatId("chat-a"),
    incoming: true,
    preview: "Мы на месте",
    sentAt: chatClockLabel("00:20"),
    messages: [peerText("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Мы на месте", "unread")],
  };
  const { rerender } = render(
    <OpenChatConversation chatId={chatId("chat-a")} source={source} hostId="user1" />,
  );
  expect(await screen.findByText("Первое сообщение")).toBeInTheDocument();
  rerender(
    <OpenChatConversation
      chatId={chatId("chat-a")}
      source={source}
      hostId="user1"
      liveNotice={notice}
    />,
  );
  const fresh = await screen.findByText("Мы на месте");
  expect(fresh.closest("[data-receipt]")?.getAttribute("data-receipt")).toBe("unread");
  await waitFor(() => {
    expect(markRead.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

test("смена чата не показывает прошлую переписку, пока новая не загрузилась", async () => {
  const first = conversation("Анна", "Первое сообщение", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  const second = conversation("Борис", "Второе сообщение", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  let releaseNext: ((loaded: ChatConversationModel) => void) | null = null;
  const source = sourceFor((id) => {
    if (id === "chat-b") {
      return new Promise((resolve) => {
        releaseNext = resolve;
      });
    }
    return Promise.resolve(first);
  });
  const { rerender } = render(
    <OpenChatConversation chatId={chatId("chat-a")} source={source} hostId="user1" />,
  );
  expect(await screen.findByText("Первое сообщение")).toBeInTheDocument();

  rerender(<OpenChatConversation chatId={chatId("chat-b")} source={source} hostId="user1" />);

  expect(screen.queryByText("Первое сообщение")).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText("Напишите сообщение...")).not.toBeInTheDocument();
  if (releaseNext === null) {
    throw new Error("загрузка второго чата не началась");
  }
  releaseNext(second);
  expect(await screen.findByText("Второе сообщение")).toBeInTheDocument();
  expect(screen.queryByText("Первое сообщение")).not.toBeInTheDocument();
});

test("фото в живом чате остаётся в ленте и не вызывает sendText", async () => {
  const user = userEvent.setup();
  const sendText = vi.fn(async () => {});
  const source = sourceFor(
    async () => conversation("Анна", "Первое сообщение", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
    sendText,
  );
  render(<OpenChatConversation chatId={chatId("chat-a")} source={source} hostId="user1" />);
  expect(await screen.findByText("Первое сообщение")).toBeInTheDocument();

  const file = new File([new Uint8Array([1, 2, 3])], "lift.png", { type: "image/png" });
  await user.upload(screen.getByLabelText("Файл фото"), file);
  await user.click(screen.getByRole("button", { name: "Отправить" }));

  expect(screen.getByAltText("Прикреплённое фото")).toHaveAttribute("src", "blob:preview-1");
  expect(screen.queryByAltText("Предпросмотр фото")).not.toBeInTheDocument();
  expect(sendText).not.toHaveBeenCalled();
});

test("текст живого чата уходит в sendText, фото из того же черновика остаётся", async () => {
  const user = userEvent.setup();
  const sendText = vi.fn(async () => {});
  const source = sourceFor(
    async () => conversation("Анна", "Первое сообщение", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
    sendText,
  );
  render(<OpenChatConversation chatId={chatId("chat-a")} source={source} hostId="user1" />);
  expect(await screen.findByText("Первое сообщение")).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText("Напишите сообщение..."), "Смотрите фото");
  const file = new File([new Uint8Array([1, 2, 3])], "lift.png", { type: "image/png" });
  await user.upload(screen.getByLabelText("Файл фото"), file);
  await user.click(screen.getByRole("button", { name: "Отправить" }));

  expect(screen.getByAltText("Прикреплённое фото")).toBeInTheDocument();
  await waitFor(() => {
    expect(sendText).toHaveBeenCalledWith("chat-a", "user1", "Смотрите фото");
  });
  expect(sendText).toHaveBeenCalledTimes(1);
});
