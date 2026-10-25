import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ConfirmedBookingsTable } from "./ConfirmedBookingsTable";
import { ConfirmedStatusCell } from "./ConfirmedStatusCell";
import { confirmedBookingFixture, statusFixture } from "./confirmedBookingFixture";
import { CONFIRMED_BOOKINGS_GRID_CLASS } from "./confirmedBookingsGrid";

const actions = {
  openMenuId: null,
  onToggleMenu: () => undefined,
  onCloseMenu: () => undefined,
  onOpenDialog: () => undefined,
};

test("пилюли «Предоплата внесена» и «Аренда завершилась» не переносятся", () => {
  const { rerender } = render(
    <ConfirmedStatusCell status={statusFixture("prepaymentPaid")} />,
  );
  expect(screen.getByText("Предоплата внесена")).toHaveClass("whitespace-nowrap");

  rerender(<ConfirmedStatusCell status={statusFixture("stayCompleted")} />);
  expect(screen.getByText("Аренда завершилась")).toHaveClass("whitespace-nowrap");
});

test("колонка статуса не сжимается уже подписи и не делит ячейку с меню", () => {
  expect(CONFIRMED_BOOKINGS_GRID_CLASS).toContain("minmax(14rem,1fr)");
  expect(CONFIRMED_BOOKINGS_GRID_CLASS).not.toContain("minmax(0,1fr)");
  expect(CONFIRMED_BOOKINGS_GRID_CLASS.endsWith("_3.5rem]")).toBe(true);

  render(
    <ConfirmedBookingsTable
      items={[confirmedBookingFixture("row-1", statusFixture("prepaymentPaid"))]}
      actions={actions}
    />,
  );

  const rows = screen
    .getByRole("table", { name: "Подтверждённые бронирования" })
    .querySelectorAll('[role="row"]');
  expect(rows[0]).toHaveClass(CONFIRMED_BOOKINGS_GRID_CLASS);
  expect(rows[1]).toHaveClass(CONFIRMED_BOOKINGS_GRID_CLASS, "h-28");

  const badge = screen.getByText("Предоплата внесена");
  const menuCell = screen.getByRole("button", { name: "Меню бронирования" }).parentElement;
  expect(menuCell).not.toContainElement(badge);
});
