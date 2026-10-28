import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { BookingCalendarGuestCard } from "./BookingCalendarGuestCard";

const SILHOUETTE = "/onboarding/avatar-placeholder.svg";
const REMOTE = "https://pb.example/api/files/users/gst000000000001/ava.jpg";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderCard(avatarUrl: string) {
  return render(
    <BookingCalendarGuestCard
      name="Мария Соколова"
      phone="+7 (900) 123-45-67"
      dates="5-10 октября"
      nights="5 ночей"
      avatarUrl={avatarUrl}
      tone="purple"
      onMessage={() => undefined}
      onDelete={() => undefined}
    />,
  );
}

function portrait(): HTMLImageElement {
  const img = document.querySelector("img.rounded-full");
  if (!(img instanceof HTMLImageElement)) {
    throw new Error("нет портрета гостя");
  }
  return img;
}

test("стоковый и локальный портрет: силуэт и файл", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  renderCard("/avatar-placeholder.png");
  expect(portrait()).toHaveAttribute("src", SILHOUETTE);
  cleanup();
  renderCard("/onboarding/avatar-placeholder.svg");
  expect(portrait()).toHaveAttribute("src", SILHOUETTE);
  cleanup();
  renderCard("/bookings/guest-anna.jpg");
  expect(portrait()).toHaveAttribute("src", "/bookings/guest-anna.jpg");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("недоступный файл гостя — силуэт", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
  renderCard(REMOTE);
  expect(portrait()).toHaveAttribute("src", SILHOUETTE);
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(REMOTE, { cache: "no-store" }));
  expect(portrait()).toHaveAttribute("src", SILHOUETTE);
});

test("живой файл гостя показываем после проверки", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  renderCard(REMOTE);
  await waitFor(() => {
    expect(portrait()).toHaveAttribute("src", REMOTE);
  });
});
