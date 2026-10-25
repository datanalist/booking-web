import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SESSION_KEY } from "../../../api/keys";
import { SessionProvider } from "../../../app/session";
import { ChatsRoute } from "./ChatsRoute";

const CHAT_ID = "gc134dxdyo7je7w";
const HOST_ID = "6ekom84sgoqlzmz";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  localStorage.removeItem(SESSION_KEY);
});

test("живой query открывает чат поддержки в списке и справа", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    userId: HOST_ID,
    email: "host@example.com",
    name: "Mikel",
    phone: "",
    onboardingComplete: true,
  }));
  vi.stubGlobal("EventSource", class {
    addEventListener(): void {}
    close(): void {}
  });
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (method !== "GET") {
      return json({ id: "ok", read: true });
    }
    if (url.includes("/api/collections/messages/")) {
      return json({
        page: 1,
        perPage: 50,
        totalItems: 1,
        totalPages: 1,
        items: [{
          id: "msg1",
          chat: CHAT_ID,
          author: "khyptzyfmyb4uzm",
          text: "Здравствуйте!",
          created: "2026-10-21 10:21:25.146Z",
        }],
      });
    }
    if (url.includes("/api/collections/chats/")) {
      return json({
        page: 1,
        perPage: 50,
        totalItems: 1,
        totalPages: 1,
        items: [{
          id: CHAT_ID,
          kind: "support",
          host: HOST_ID,
          guest: "khyptzyfmyb4uzm",
          staff: "khyptzyfmyb4uzm",
          last_message: "Здравствуйте!",
          last_message_at: "2026-10-21 10:21:25.146Z",
          host_last_read: "",
          created: "2026-10-21 10:21:25.146Z",
          updated: "2026-10-21 10:21:25.146Z",
        }],
      });
    }
    return json({ page: 1, perPage: 50, totalItems: 0, totalPages: 0, items: [] });
  });

  render(
    <SessionProvider>
      <MemoryRouter initialEntries={[`/chats?chat=${CHAT_ID}`]}>
        <Routes>
          <Route path="/chats" element={<ChatsRoute />} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Поддержка/ })).toHaveAttribute("aria-current", "true");
  });
  const region = await screen.findByRole("region", { name: "Переписка с Поддержка" });
  expect(within(region).getByText("Здравствуйте!")).toBeInTheDocument();
});

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}
