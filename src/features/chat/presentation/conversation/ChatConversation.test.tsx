import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { chatMessagesMock } from "../../data/chatMessageMocks";
import { chatId } from "../../domain/ChatId";
import type { ChatMessage } from "../../domain/ChatMessage";
import { chatMessageId } from "../../domain/ChatMessageId";
import { chatPhotoUrl } from "../../domain/ChatPhoto";
import type { ConversationHeading } from "../../domain/ConversationHeading";
import { messageTimeLabel } from "../../domain/MessageTimeLabel";
import { chatAssets } from "../assets/chatAssets";
import { ChatConversation } from "./ChatConversation";
import {
  conversationDateLabel,
  conversationHeadingMock,
  conversationSelfAvatarUrl,
} from "./conversationHeadingMock";

function renderConversation() {
  const photoUrl = chatPhotoUrl(chatAssets.messagePhoto);
  if (photoUrl === null) {
    throw new Error("мок чата");
  }
  return render(
    <ChatConversation
      chatId={chatId("chat-ekaterina")}
      heading={conversationHeadingMock}
      dateLabel={conversationDateLabel}
      messages={chatMessagesMock({ url: photoUrl, alt: "Фото помещения у лифта" })}
      selfAvatarUrl={conversationSelfAvatarUrl}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  let n = 0;
  URL.createObjectURL = () => {
    n += 1;
    return `blob:preview-${n}`;
  };
  URL.revokeObjectURL = vi.fn();
});

test("показывает сообщения обеих сторон и шапку", () => {
  renderConversation();
  const peer = screen.getByText(/раннее заселение/);
  const own = screen.getByText(/код двери 348957/);
  expect(peer.closest("[data-author]")?.getAttribute("data-author")).toBe("peer");
  expect(own.closest("[data-author]")?.getAttribute("data-author")).toBe("self");
  expect(peer.closest("div")?.className).toContain("rounded-br-lg");
  expect(peer.closest("div")?.className).toContain("bg-white");
  expect(own.closest("div")?.className).toContain("rounded-bl-lg");
  expect(own.closest("div")?.className).toContain("bg-[rgba(251,192,40,0.06)]");
  expect(screen.getByText("Екатерина Кондратьева")).toBeInTheDocument();
  expect(screen.getByText("10 сентября")).toBeInTheDocument();
});

test("непрочитанные входящие подсвечены, прочитанные остаются белыми", () => {
  renderConversation();
  const read = screen.getByText(/раннее заселение/);
  const unread = screen.getByText("Оплату перевела, чек придёт следом");
  expect(read.closest("[data-receipt]")?.getAttribute("data-receipt")).toBe("read");
  expect(read.closest("[data-receipt]")?.className).toContain("bg-white");
  expect(unread.closest("[data-receipt]")?.getAttribute("data-receipt")).toBe("unread");
  expect(unread.closest("[data-receipt]")?.className).toContain("bg-[rgba(251,192,40,0.35)]");
  expect(unread.closest("[data-receipt]")?.className).toContain("border-[#fbc028]");
  expect(screen.getAllByText("Непрочитано", { selector: ".sr-only" })).toHaveLength(2);
});

test("фото-сообщение лежит в скруглённой рамке со временем", () => {
  renderConversation();
  const photo = screen.getByRole("img", { name: "Фото помещения у лифта" });
  const frame = photo.parentElement;
  expect(frame?.className).toContain("rounded-tl-lg");
  expect(frame?.className).toContain("rounded-tr-lg");
  expect(frame?.className).toContain("rounded-bl-lg");
  expect(frame?.className).not.toContain("rounded-br-lg");
  expect(frame).toHaveTextContent("10:07");
});

test("поле ввода сильно скруглено", () => {
  renderConversation();
  const field = screen.getByPlaceholderText("Напишите сообщение...");
  expect(field.closest(".rounded-3xl")).not.toBeNull();
});

test("прикрепляет фото, показывает превью и отправляет его в ленту", async () => {
  const user = userEvent.setup();
  renderConversation();
  const file = new File([new Uint8Array([1, 2, 3])], "lift.png", { type: "image/png" });
  await user.upload(screen.getByLabelText("Файл фото"), file);
  expect(screen.getByAltText("Предпросмотр фото")).toHaveAttribute("src", "blob:preview-1");
  await user.click(screen.getByRole("button", { name: "Отправить" }));
  expect(screen.getByAltText("Прикреплённое фото")).toHaveAttribute("src", "blob:preview-1");
  expect(screen.queryByAltText("Предпросмотр фото")).not.toBeInTheDocument();
});

test("снятие превью освобождает объектный URL", async () => {
  const user = userEvent.setup();
  renderConversation();
  const file = new File([new Uint8Array([1, 2, 3])], "lift.png", { type: "image/png" });
  await user.upload(screen.getByLabelText("Файл фото"), file);
  await user.click(screen.getByRole("button", { name: "Убрать фото" }));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  expect(screen.queryByAltText("Предпросмотр фото")).not.toBeInTheDocument();
});

test("не принимает файл не-изображения", () => {
  renderConversation();
  const file = new File([new Uint8Array([1])], "note.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText("Файл фото"), {
    target: { files: { 0: file, length: 1 } },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("только изображение");
  expect(screen.queryByAltText("Предпросмотр фото")).not.toBeInTheDocument();
});

test("отправляет текстовое сообщение в ленту", async () => {
  const user = userEvent.setup();
  renderConversation();
  await user.type(screen.getByPlaceholderText("Напишите сообщение..."), "Багаж оставим");
  await user.click(screen.getByRole("button", { name: "Отправить" }));
  const sent = screen.getByText("Багаж оставим");
  expect(sent.closest("[data-author]")?.getAttribute("data-author")).toBe("self");
});

test("длинный текст без пробелов переносится в поле и в пузыре", async () => {
  const user = userEvent.setup();
  renderConversation();
  const longWord = "sdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd";
  const field = screen.getByPlaceholderText("Напишите сообщение...");
  expect(field.tagName).toBe("TEXTAREA");
  expect(field.className).toContain("[overflow-wrap:anywhere]");
  expect(field.className).toContain("whitespace-pre-wrap");
  await user.type(field, longWord);
  await user.click(screen.getByRole("button", { name: "Отправить" }));
  const sent = screen.getByText(longWord);
  expect(sent.className).toContain("[overflow-wrap:anywhere]");
  expect(sent.className).toContain("whitespace-pre-wrap");
  expect(sent.closest("[data-author]")?.getAttribute("data-author")).toBe("self");
});

test("явный перевод строки сохраняется в пузыре", async () => {
  const user = userEvent.setup();
  renderConversation();
  const field = screen.getByPlaceholderText("Напишите сообщение...");
  fireEvent.change(field, { target: { value: "первая\nвторая" } });
  await user.click(screen.getByRole("button", { name: "Отправить" }));
  const sent = screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "первая\nвторая");
  expect(sent).toBeInTheDocument();
});

const SILHOUETTE = "/onboarding/avatar-placeholder.svg";
const REMOTE_PEER = "https://pb.example/api/files/users/g1/anna.jpg";

function textMessage(id: string, author: "peer" | "self", body: string): ChatMessage {
  const messageId = chatMessageId(id);
  const timeLabel = messageTimeLabel("10:07");
  if (messageId === null || timeLabel === null) {
    throw new Error("мок сообщения");
  }
  return { kind: "text", id: messageId, author, timeLabel, body, receipt: "read" };
}

function headerAvatar(): HTMLElement {
  const img = document.querySelector("header img.rounded-full");
  if (!(img instanceof HTMLElement)) {
    throw new Error("нет аватара в шапке");
  }
  return img;
}

function authorAvatar(author: "peer" | "self"): HTMLElement {
  const img = document.querySelector(`[data-author='${author}'] img`);
  if (!(img instanceof HTMLElement)) {
    throw new Error("нет аватара сообщения");
  }
  return img;
}

function renderPeer(heading: ConversationHeading) {
  return render(
    <ChatConversation
      chatId={chatId("chat-live")}
      heading={heading}
      dateLabel="10 сентября"
      messages={[
        textMessage("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "peer", "Привет"),
        textMessage("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "self", "Ответ"),
      ]}
      selfAvatarUrl="/self.png"
    />,
  );
}

const listingHeading = (peerAvatarUrl: string): ConversationHeading => ({
  kind: "listing",
  peerName: "Анна",
  peerAvatarUrl,
  listingTitle: "Студия",
  city: "Москва",
  datesLabel: "5-10 октября",
  guestsLabel: "2 гостя",
  listingThumbUrl: "/cover.jpg",
});

test("макет сида оставляет локальный портрет собеседника", () => {
  renderConversation();
  expect(headerAvatar()).toHaveAttribute("src", chatAssets.avatarEkaterina);
});

test("стоковый аватар собеседника — силуэт, у поддержки значок поддержки", () => {
  renderPeer(listingHeading("https://pb.example/api/files/users/g1/avatar-placeholder.png"));
  expect(headerAvatar()).toHaveAttribute("src", SILHOUETTE);
  expect(authorAvatar("peer")).toHaveAttribute("src", SILHOUETTE);
  cleanup();
  renderPeer({
    kind: "direct",
    peerName: "Поддержка",
    peerAvatarUrl: "/avatar-placeholder.png",
  });
  expect(headerAvatar()).toHaveAttribute("src", chatAssets.avatarSupport);
});

test("недоступный аватар собеседника — силуэт, свой локальный остаётся", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
  renderPeer(listingHeading(REMOTE_PEER));
  expect(headerAvatar()).toHaveAttribute("src", SILHOUETTE);
  expect(authorAvatar("peer")).toHaveAttribute("src", SILHOUETTE);
  expect(authorAvatar("self")).toHaveAttribute("src", "/self.png");
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(REMOTE_PEER, { cache: "no-store" }));
  expect(headerAvatar()).toHaveAttribute("src", SILHOUETTE);
  expect(authorAvatar("peer")).toHaveAttribute("src", SILHOUETTE);
});

test("живой аватар собеседника показываем после проверки", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  renderPeer(listingHeading(REMOTE_PEER));
  await waitFor(() => {
    expect(headerAvatar()).toHaveAttribute("src", REMOTE_PEER);
    expect(authorAvatar("peer")).toHaveAttribute("src", REMOTE_PEER);
  });
});
