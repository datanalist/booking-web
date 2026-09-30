import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { bookingCalendarMarksFor } from "./bookingCalendarMarksFor";
import { BookingCalendarMonthGrid } from "./BookingCalendarMonthGrid";
import { buildCalendarWeeks } from "./buildCalendarWeeks";
import type { YearMonth } from "./YearMonth";

const MARKS = bookingCalendarMarksFor(new Date(2024, 11, 15));

afterEach(() => {
  cleanup();
});

const MONTHS: readonly YearMonth[] = [
  { year: 2021, month: 2 },
  { year: 2024, month: 2 },
  { year: 2024, month: 11 },
  { year: 2024, month: 12 },
  { year: 2025, month: 1 },
];

test("рендер сетки держит 42 ячейки одной высоты для разных месяцев", () => {
  const heights = new Set<string>();
  for (const month of MONTHS) {
    const view = render(
      <BookingCalendarMonthGrid
        month={month}
        weeks={buildCalendarWeeks(month, MARKS)}
        selectedDay={1}
        onSelectDay={() => undefined}
      />,
    );
    const cells = view.container.querySelectorAll("[data-calendar-cell]");
    expect(cells).toHaveLength(42);
    const sample = cells[0];
    expect(sample).toBeDefined();
    if (sample === undefined) {
      return;
    }
    heights.add(sample.className.includes("h-9") ? "h-9" : sample.className);
    expect([...cells].every((cell) => cell.className.includes("h-9"))).toBe(
      true,
    );
    view.unmount();
  }
  expect(heights.size).toBe(1);
});
