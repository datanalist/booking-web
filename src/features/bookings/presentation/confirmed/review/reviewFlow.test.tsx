import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { ConfirmedBookingsPanel } from "../ConfirmedBookingsPanel";
import { bookingReviewsStore } from "./bookingReviewsStore";

const GUEST = "Петров Иван";
const BOOKING_ID = "confirmed-4";

afterEach(() => {
  cleanup();
  bookingReviewsStore.reset();
});

function menuTrigger(): HTMLElement {
  const row = screen.getByText(GUEST).closest<HTMLElement>('[role="row"]');
  if (row === null) {
    throw new Error("Row not found");
  }
  return within(row).getByRole("button", { name: "Меню бронирования" });
}

async function openModal(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup();
  render(<ConfirmedBookingsPanel query="" forceEmpty={false} />);
  await user.click(menuTrigger());
  await user.click(screen.getByRole("menuitem", { name: "Оставить отзыв" }));
  return user;
}

describe("review from the «три точки» menu", () => {
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
    expect(bookingReviewsStore.get(BOOKING_ID)).toEqual({
      bookingId: BOOKING_ID,
      rating: 4,
      comment: "Все было прекрасно!",
    });

    await user.click(menuTrigger());
    expect(screen.getByRole("menuitem", { name: "Отзыв оставлен" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: "Оставить отзыв" })).toBeNull();
  });

  test("закрывается по Esc, «Вернуться», X и клику по оверлею без сохранения", async () => {
    const user = await openModal();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(menuTrigger());
    await user.click(screen.getByRole("menuitem", { name: "Оставить отзыв" }));
    await user.click(screen.getByRole("button", { name: "Вернуться" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(menuTrigger());
    await user.click(screen.getByRole("menuitem", { name: "Оставить отзыв" }));
    await user.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(menuTrigger());
    await user.click(screen.getByRole("menuitem", { name: "Оставить отзыв" }));
    const overlay = screen.getByRole("dialog").parentElement;
    if (overlay === null) {
      throw new Error("overlay not found");
    }
    await user.click(overlay);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(bookingReviewsStore.get(BOOKING_ID)).toBeUndefined();
  });

  test("фокус возвращается на кнопку меню после закрытия модалки", async () => {
    const user = await openModal();
    await user.keyboard("{Escape}");
    expect(menuTrigger()).toHaveFocus();
  });
});
