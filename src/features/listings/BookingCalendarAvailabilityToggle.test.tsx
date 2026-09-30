import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { BookingCalendarAvailabilityToggle } from "./BookingCalendarAvailabilityToggle";

afterEach(() => {
  cleanup();
});

function renderSwitch(checked: boolean, disabled: boolean): HTMLElement {
  render(
    <BookingCalendarAvailabilityToggle
      checked={checked}
      disabled={disabled}
      label="доступность дня"
      onToggle={vi.fn()}
    />,
  );
  return screen.getByRole("switch", { name: "доступность дня" });
}

test("выключенное состояние рисует дорожку с обводкой", () => {
  const track = renderSwitch(false, false);
  expect(track.className).toContain("border-2");
  expect(track.className).toContain("border-[#f88a2a]");
  expect(track.className).toContain("bg-white");
  expect(track).toHaveAttribute("aria-checked", "false");
  expect(track).toHaveAttribute("role", "switch");
});

test("включённое состояние закрашивает дорожку оранжевым", () => {
  const track = renderSwitch(true, false);
  expect(track.className).toContain("bg-[#f88a2a]");
  expect(track).toHaveAttribute("aria-checked", "true");
});

test("недоступный день отключает переключатель и оставляет обводку", () => {
  const track = renderSwitch(false, true);
  expect(track).toBeDisabled();
  expect(track.className).toContain("border-2");
  expect(track.className).toContain("opacity-40");
});
