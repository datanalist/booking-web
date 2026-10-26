import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { RouterProvider } from "react-router-dom";
import { SESSION_KEY } from "../api/keys";
import { PB_TOKEN_KEY } from "../api/pocketbase/pbSession";
import { createAppRouter } from "./router";
import { SessionProvider } from "./session";

const readySession = {
  userId: "user123456789ab",
  email: "host@example.com",
  name: "Анна",
  phone: "+79001234567",
  onboardingComplete: true,
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.pushState({}, "", "/");
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

test("истёкший токен при открытии кабинета ведёт на вход", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  localStorage.setItem(SESSION_KEY, JSON.stringify(readySession));
  localStorage.setItem(PB_TOKEN_KEY, jwt({ exp: 1 }));
  window.history.pushState({}, "", "/listings");

  render(
    <SessionProvider>
      <RouterProvider router={createAppRouter()} />
    </SessionProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Войти" })).toBeInTheDocument();
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  expect(localStorage.getItem(PB_TOKEN_KEY)).toBeNull();
});

test("ответ 401 выбрасывает из кабинета на вход", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  vi.stubEnv("VITE_POCKETBASE_URL", "https://pb.example");
  localStorage.setItem(SESSION_KEY, JSON.stringify(readySession));
  localStorage.setItem(PB_TOKEN_KEY, jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  vi.stubGlobal("fetch", vi.fn(async () => new Response(
    JSON.stringify({ message: "The request requires valid record authorization token." }),
    { status: 401, headers: { "Content-Type": "application/json" } },
  )));
  window.history.pushState({}, "", "/listings");

  render(
    <SessionProvider>
      <RouterProvider router={createAppRouter()} />
    </SessionProvider>,
  );

  expect(await screen.findByRole("heading", { name: "Войти" })).toBeInTheDocument();
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  expect(localStorage.getItem(PB_TOKEN_KEY)).toBeNull();
});

test("по наступлении exp открывается вход без нового запроса", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  vi.stubEnv("VITE_POCKETBASE_URL", "https://pb.example");
  localStorage.setItem(SESSION_KEY, JSON.stringify(readySession));
  localStorage.setItem(PB_TOKEN_KEY, jwt({ exp: Math.floor(Date.parse("2026-06-01T12:00:05.000Z") / 1000) }));
  vi.stubGlobal("fetch", vi.fn(async () => new Response(
    JSON.stringify({ page: 1, perPage: 200, totalItems: 0, totalPages: 0, items: [] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  )));
  window.history.pushState({}, "", "/listings");

  render(
    <SessionProvider>
      <RouterProvider router={createAppRouter()} />
    </SessionProvider>,
  );

  expect(screen.queryByRole("heading", { name: "Войти" })).not.toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });

  expect(screen.getByRole("heading", { name: "Войти" })).toBeInTheDocument();
  expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  expect(localStorage.getItem(PB_TOKEN_KEY)).toBeNull();
});

function jwt(payload: object): string {
  const encode = (value: object): string =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.sig`;
}
