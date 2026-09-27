import { describe, expect, test } from "vitest";
import { formatIsoDateDisplay, parseIsoDate } from "./isoDate";

describe("parseIsoDate", () => {
  test("accepts valid calendar dates", () => {
    expect(parseIsoDate("2025-01-01")).toBe("2025-01-01");
    expect(parseIsoDate("2024-02-29")).toBe("2024-02-29");
  });

  test("rejects malformed and impossible dates", () => {
    expect(parseIsoDate("")).toBeNull();
    expect(parseIsoDate("01.01.2025")).toBeNull();
    expect(parseIsoDate("2025-13-01")).toBeNull();
    expect(parseIsoDate("2025-02-29")).toBeNull();
    expect(parseIsoDate("2025-1-1")).toBeNull();
  });
});

describe("formatIsoDateDisplay", () => {
  test("formats as DD.MM.YYYY", () => {
    const date = parseIsoDate("2025-01-01");
    expect(date).not.toBeNull();
    if (date === null) {
      return;
    }
    expect(formatIsoDateDisplay(date)).toBe("01.01.2025");
  });
});
