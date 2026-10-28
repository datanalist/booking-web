import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { chatId } from "../../domain/ChatId";
import { chatClockLabel, type ChatThread } from "../../domain/ChatThread";
import { chatAssets } from "../assets/chatAssets";
import { ChatListItem } from "./ChatListItem";

const SILHOUETTE = "/onboarding/avatar-placeholder.svg";
const REMOTE = "https://pb.example/api/files/users/g1/anna.jpg";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

function renderItem(patch: Partial<ChatThread>) {
  return render(
    <ChatListItem thread={thread(patch)} selected={false} onSelect={() => undefined} />,
  );
}

function avatar(): HTMLImageElement {
  const img = document.querySelector("img");
  if (!(img instanceof HTMLImageElement)) {
    throw new Error("нет аватара");
  }
  return img;
}

test("макет без avatarUrl оставляет локальный портрет", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  renderItem({ avatarKey: "anna" });
  expect(avatar()).toHaveAttribute("src", chatAssets.avatarAnna);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("локальный файл показываем сразу, стоковый — силуэт", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  renderItem({ avatarUrl: "/bookings/guest-anna.jpg" });
  expect(avatar()).toHaveAttribute("src", "/bookings/guest-anna.jpg");
  cleanup();
  renderItem({ avatarUrl: "https://pb.example/api/files/users/g1/avatar-placeholder.png" });
  expect(avatar()).toHaveAttribute("src", SILHOUETTE);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("недоступный файл собеседника — силуэт", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
  renderItem({ avatarUrl: REMOTE });
  expect(avatar()).toHaveAttribute("src", SILHOUETTE);
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(REMOTE, { cache: "no-store" }));
  expect(avatar()).toHaveAttribute("src", SILHOUETTE);
});

test("живой файл собеседника показываем после проверки", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  renderItem({ avatarUrl: REMOTE });
  await waitFor(() => {
    expect(avatar()).toHaveAttribute("src", REMOTE);
  });
});
