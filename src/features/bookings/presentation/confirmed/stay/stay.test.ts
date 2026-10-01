import { describe, expect, test } from "vitest";
import { bookingStay } from "./BookingStay";
import { formatNights } from "./formatNights";
import { formatStayLong } from "./formatStayLong";
import { formatStayTable } from "./formatStayTable";
import { parseIsoDate } from "./IsoDate";
import { stayNights } from "./stayNights";

describe("stay", () => {
  test("rejects malformed and non-existent dates", () => {
    expect(() => parseIsoDate("2024-13-01")).toThrow();
    expect(() => parseIsoDate("2024-02-30")).toThrow();
    expect(() => parseIsoDate("5 декабря")).toThrow();
  });

  test("rejects check-out not after check-in", () => {
    expect(() => bookingStay("2024-12-10", "2024-12-10")).toThrow();
  });

  test("counts nights and formats labels", () => {
    const stay = bookingStay("2024-12-05", "2024-12-10");
    expect(stayNights(stay)).toBe(5);
    expect(formatStayLong(stay)).toBe("5-10 декабря");
    expect(formatStayTable(stay)).toBe("05.12.24-10.12.24");
  });

  test("formats a stay across months", () => {
    const stay = bookingStay("2024-11-28", "2024-12-02");
    expect(formatStayLong(stay)).toBe("28 ноября - 2 декабря");
    expect(stayNights(stay)).toBe(4);
  });

  test("pluralizes nights", () => {
    expect(formatNights(1)).toBe("1 ночь");
    expect(formatNights(3)).toBe("3 ночи");
    expect(formatNights(5)).toBe("5 ночей");
    expect(formatNights(11)).toBe("11 ночей");
    expect(formatNights(21)).toBe("21 ночь");
  });
});
