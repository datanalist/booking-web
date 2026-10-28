import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useAccountPhotoSrc } from "./useAccountPhotoSrc";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Probe({ photoUrl }: { photoUrl?: string }) {
  const src = useAccountPhotoSrc(photoUrl);
  return <span data-testid="src">{src ?? ""}</span>;
}

test("без адреса фото нет", () => {
  render(<Probe />);
  expect(screen.getByTestId("src").textContent).toBe("");
});

test("стоковый портрет не считается фото", () => {
  render(<Probe photoUrl="/avatar-placeholder.png" />);
  expect(screen.getByTestId("src").textContent).toBe("");
});

test("data URL показываем сразу", () => {
  render(<Probe photoUrl="data:image/png;base64,abc" />);
  expect(screen.getByTestId("src").textContent).toBe("data:image/png;base64,abc");
});

test("файл, которого уже нет на сервере, не показываем из кэша", async () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
  vi.stubGlobal("fetch", fetchMock);
  const url = "https://pb.example/api/files/users/u/avatar.jpg";
  render(<Probe photoUrl={url} />);
  expect(screen.getByTestId("src").textContent).toBe("");
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(fetchMock).toHaveBeenCalledWith(url, { cache: "no-store" });
  expect(screen.getByTestId("src").textContent).toBe("");
});

test("живой файл показываем после проверки без кэша", async () => {
  const url = "https://pb.example/api/files/users/u/avatar.jpg";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 200 })),
  );
  render(<Probe photoUrl={url} />);
  await waitFor(() => {
    expect(screen.getByTestId("src").textContent).toBe(url);
  });
});
