import { expect, test, vi } from "vitest";
import { openChatRealtime } from "./openChatRealtime";

test("после PB_CONNECT подписывается и отдаёт события темы", async () => {
  const socket = fakeSocket();
  const subscribe = vi.fn(async () => {});
  const onData = vi.fn();
  const stop = openChatRealtime({
    url: "https://pb.example/api/realtime",
    topics: ["messages"],
    subscribe,
    onData,
    openSocket: () => socket,
  });

  socket.emit("PB_CONNECT", JSON.stringify({ clientId: "client-1" }));
  await vi.waitFor(() => {
    expect(subscribe).toHaveBeenCalledWith("client-1");
  });
  socket.emit("messages", JSON.stringify({ action: "create", record: { id: "m1" } }));
  expect(onData).toHaveBeenCalledWith(
    "messages",
    JSON.stringify({ action: "create", record: { id: "m1" } }),
  );
  stop();
  socket.emit("messages", "{}");
  expect(onData).toHaveBeenCalledTimes(1);
});

function fakeSocket() {
  const listeners = new Map<string, Array<(event: { data: string }) => void>>();
  return {
    addEventListener(type: string, listener: (event: { data: string }) => void) {
      const bucket = listeners.get(type) ?? [];
      bucket.push(listener);
      listeners.set(type, bucket);
    },
    close() {
      listeners.clear();
    },
    emit(type: string, data: string) {
      for (const listener of listeners.get(type) ?? []) {
        listener({ data });
      }
    },
  };
}
