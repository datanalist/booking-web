import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import type { ConfirmedBooking } from "../ConfirmedBooking";
import { StayCompletedReviewMenu } from "./StayCompletedReviewMenu";
import { bookingReviewsStore } from "./bookingReviewsStore";

const BOOKING: ConfirmedBooking = {
  id: "confirmed-test",
  guestName: "Петров Иван",
  guestPhone: "+7 (900) 123-45-67",
  guestAvatarUrl: "/a.jpg",
  housingTitle: "Студия",
  housingAddress: "Москва",
  housingPhotoUrl: "/h.jpg",
  datesLabel: "14.11.24-19.11.24",
  priceLabel: "15 460 ₽",
  status: { kind: "stayCompleted" },
};

afterEach(() => {
  cleanup();
  bookingReviewsStore.reset();
});

async function openModal(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  render(<StayCompletedReviewMenu booking={BOOKING} />);
  await user.click(screen.getByRole("button", { name: "Меню бронирования" }));
  await user.click(screen.getByRole("menuitem", { name: "Оставить отзыв" }));
  return user;
}

describe("StayCompletedReviewMenu", () => {
  test("модалка открывается пустой, «Отправить» заблокирована", async () => {
    await openModal();
    expect(screen.getByRole("dialog", { name: "Оставить отзыв" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Отправить" })).toBeDisabled();
    expect(screen.getByText("0/500")).toBeVisible();
  });

  test("после выбора звезды и отправки отзыв сохраняется, пункт меняется", async () => {
    const user = await openModal();
    await user.click(screen.getByRole("radio", { name: "4 из 5" }));
    await user.type(screen.getByLabelText("Комментарий"), "Все было прекрасно!");
    expect(screen.getByText("19/500")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Отправить" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(bookingReviewsStore.get(BOOKING.id)).toEqual({
      bookingId: BOOKING.id,
      rating: 4,
      comment: "Все было прекрасно!",
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Меню бронирования" }),
    );
    expect(screen.getByRole("menuitem", { name: "Отзыв оставлен" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: "Оставить отзыв" })).toBeNull();
  });

  test("закрывается по Esc, «Вернуться», X и клику по оверлею без сохранения", async () => {
    const user = await openModal();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Меню бронирования" }));
    await user.click(screen.getByRole("menuitem", { name: "Оставить отзыв" }));
    await user.click(screen.getByRole("button", { name: "Вернуться" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Меню бронирования" }));
    await user.click(screen.getByRole("menuitem", { name: "Оставить отзыв" }));
    await user.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Меню бронирования" }));
    await user.click(screen.getByRole("menuitem", { name: "Оставить отзыв" }));
    const overlay = screen.getByRole("dialog").parentElement;
    if (overlay === null) {
      throw new Error("overlay not found");
    }
    await user.click(overlay);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(bookingReviewsStore.get(BOOKING.id)).toBeUndefined();
  });
});
