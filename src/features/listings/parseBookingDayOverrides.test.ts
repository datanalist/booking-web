import { expect, test } from "vitest";
import { MemoryStorage } from "../../lib/memoryStorage";
import { parseIsoDate } from "../../lib/isoDate";
import { parseBookingDayOverrides } from "./parseBookingDayOverrides";
import { readBookingDayOverrides } from "./readBookingDayOverrides";
import { writeBookingDayOverrides } from "./writeBookingDayOverrides";

test("парсер принимает только ISO-даты и игнорирует мусор", () => {
  expect(parseBookingDayOverrides("not-json").blocked.size).toBe(0);
  expect(parseBookingDayOverrides("[]").blocked.size).toBe(0);
  const parsed = parseBookingDayOverrides(
    JSON.stringify({
      blocked: ["2026-10-02", "02.10.2026", 1, "2026-02-31"],
      released: ["2026-10-16"],
    }),
  );
  expect([...parsed.blocked]).toEqual(["2026-10-02"]);
  expect([...parsed.released]).toEqual(["2026-10-16"]);
});

test("запись и чтение переживают Storage", () => {
  const storage = new MemoryStorage();
  const blocked = parseIsoDate("2026-10-20");
  const released = parseIsoDate("2026-10-16");
  expect(blocked).not.toBeNull();
  expect(released).not.toBeNull();
  if (blocked === null || released === null) {
    return;
  }
  expect(
    writeBookingDayOverrides(storage, "studio", {
      blocked: new Set([blocked]),
      released: new Set([released]),
    }),
  ).toBe(true);
  const loaded = readBookingDayOverrides(storage, "studio");
  expect(loaded.blocked.has(blocked)).toBe(true);
  expect(loaded.released.has(released)).toBe(true);
  expect(readBookingDayOverrides(storage, "other").blocked.size).toBe(0);
});
