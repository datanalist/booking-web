import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import { SESSION_KEY } from "../../../api/keys";
import { bookingRequestId } from "../domain/BookingRequest";
import type { BookingsSnapshot } from "../pocketbase";
import { BookingsPage } from "./BookingsPage";
import { cancelledBookingsStore } from "./cancelled/cancelledBookingsStore";
import { confirmedBookingsStore } from "./confirmed/confirmedBookingsStore";
import { bookingReviewsStore } from "./confirmed/review/bookingReviewsStore";

const gate = vi.hoisted(() => {
  let resolveLoad: (snapshot: unknown) => void = () => {};
  return {
    load: () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    resolve(snapshot: unknown) {
      resolveLoad(snapshot);
    },
  };
});

vi.mock("../pocketbase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../pocketbase")>();
  return {
    ...actual,
    createPbBookingsSource: () => ({
      load: () => gate.load(),
      accept: async () => undefined,
      reject: async () => undefined,
      hostCancel: async () => undefined,
      resolveRequest: async () => undefined,
      createGuestReview: async () => undefined,
    }),
  };
});

const MOCK_GUESTS = [
  "Иваненко Анна",
  "Ковалев Леонид",
  "Полякова Кристина",
  "Петров Иван",
  "Симонов Степан",
  "Орлова Мария",
];

afterEach(() => {
  cleanup();
  localStorage.removeItem(SESSION_KEY);
  confirmedBookingsStore.reset();
  cancelledBookingsStore.reset();
  bookingReviewsStore.reset();
});

function renderBookings(): void {
  render(
    <MemoryRouter initialEntries={["/bookings"]}>
      <Routes>
        <Route path="/bookings" element={<BookingsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

test("pocketbase load does not flash booking mocks", async () => {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: "host-1" }));
  const user = userEvent.setup();
  renderBookings();

  for (const name of MOCK_GUESTS) {
    expect(screen.queryByText(name)).not.toBeInTheDocument();
  }
  expect(screen.queryByRole("heading", { name: "Нет заявок" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Подтверждены" }));
  expect(screen.queryByText("Ожидание предоплаты")).not.toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Отклонены" }));
  expect(screen.queryByText("Уютная студия в центре Москвы")).not.toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Отменены" }));
  expect(screen.queryByText("Симонов Степан")).not.toBeInTheDocument();

  const snapshot: BookingsSnapshot = {
    requests: [
      {
        id: bookingRequestId("live-1"),
        guestName: "Елена Волкова",
        guestPhone: "+7 (903) 110-45-21",
        guestAvatarUrl: "/guest.jpg",
        listingTitle: "Квартира у Парка Горького",
        listingAddress: "Москва, ул. Крымский Вал, 9, Москва",
        listingPhotoUrl: "/listing.jpg",
        datesLabel: "01.05.27-10.05.27",
        priceLabel: "67 500 ₽",
      },
    ],
    confirmed: [],
    rejected: [],
    cancelled: [],
  };
  gate.resolve(snapshot);

  await user.click(screen.getByRole("tab", { name: "Заявки" }));
  expect(await screen.findByText("Елена Волкова")).toBeInTheDocument();
  for (const name of MOCK_GUESTS) {
    expect(screen.queryByText(name)).not.toBeInTheDocument();
  }

  await user.click(screen.getByRole("tab", { name: "Подтверждены" }));
  expect(screen.getByRole("heading", { name: "Нет бронирований" })).toBeInTheDocument();
  expect(screen.queryByText("Ожидание предоплаты")).not.toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Отклонены" }));
  expect(screen.getByRole("heading", { name: "Нет бронирований" })).toBeInTheDocument();
  expect(screen.queryByText("Уютная студия в центре Москвы")).not.toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "Отменены" }));
  expect(screen.getByRole("heading", { name: "Нет бронирований" })).toBeInTheDocument();
});
