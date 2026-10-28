import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { accountPhotoCandidate, useAccountPhotoSrc, useVisibleAccountPhoto } from "./useAccountPhotoSrc";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const SILHOUETTE = "/onboarding/avatar-placeholder.svg";

function Probe({ photoUrl }: { photoUrl?: string }) {
  const src = useAccountPhotoSrc(photoUrl);
  return <span data-testid="src">{src ?? ""}</span>;
}

function VisibleProbe({ photoUrl }: { photoUrl?: string }) {
  const src = useVisibleAccountPhoto(photoUrl);
  return <span data-testid="visible">{src}</span>;
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

test("кандидат отбрасывает пустое и стоковое, живой адрес оставляет", () => {
  const remote = "https://pb.example/api/files/users/u/ava.jpg";
  expect(accountPhotoCandidate(undefined)).toBeUndefined();
  expect(accountPhotoCandidate("  ")).toBeUndefined();
  expect(accountPhotoCandidate("/avatar-placeholder.png")).toBeUndefined();
  expect(
    accountPhotoCandidate("https://pb.example/api/files/users/u/avatar-placeholder.png"),
  ).toBeUndefined();
  expect(accountPhotoCandidate(`  ${remote}  `)).toBe(remote);
  expect(accountPhotoCandidate("/bookings/guest-anna.jpg")).toBe("/bookings/guest-anna.jpg");
});

test("видимый портрет без файла и стоковый файл — силуэт", () => {
  render(<VisibleProbe />);
  expect(screen.getByTestId("visible").textContent).toBe(SILHOUETTE);
  cleanup();
  render(<VisibleProbe photoUrl="https://pb.example/api/files/users/u/avatar-placeholder.png" />);
  expect(screen.getByTestId("visible").textContent).toBe(SILHOUETTE);
});

test("видимый локальный файл показываем сразу", () => {
  render(<VisibleProbe photoUrl="/bookings/guest-anna.jpg" />);
  expect(screen.getByTestId("visible").textContent).toBe("/bookings/guest-anna.jpg");
});

test("видимый недоступный файл — силуэт", async () => {
  const url = "https://pb.example/api/files/users/u/avatar.jpg";
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
  render(<VisibleProbe photoUrl={url} />);
  expect(screen.getByTestId("visible").textContent).toBe(SILHOUETTE);
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(url, { cache: "no-store" }));
  expect(screen.getByTestId("visible").textContent).toBe(SILHOUETTE);
});

test("видимый живой файл показываем после проверки", async () => {
  const url = "https://pb.example/api/files/users/u/avatar.jpg";
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  render(<VisibleProbe photoUrl={url} />);
  await waitFor(() => {
    expect(screen.getByTestId("visible").textContent).toBe(url);
  });
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
