import { expect, test } from "vitest";
import { emptyDraft } from "./emptyDraft";
import { parseIsoDate } from "./isoDate";
import { validateStep } from "./wizardValidation";

const base = emptyDraft("u1");
const sampleDate = parseIsoDate("2026-01-01");
if (sampleDate === null) {
  throw new Error("fixture date must parse");
}

test("step 1 requires fields", () => {
  expect(validateStep(1, base).title).toBeTruthy();
  expect(validateStep(1, { ...base, title: "A", address: "B", description: "C", housingType: "apartment" })).toEqual({});
});

test("step 2 photo count", () => {
  expect(validateStep(2, { ...base, photos: ["1"] }).photos).toBe("Добавьте ещё 5 фото");
  expect(validateStep(2, { ...base, photos: Array(6).fill("x") })).toEqual({});
});

test("step 3 always ok", () => {
  expect(validateStep(3, base)).toEqual({});
});

test("step 5 parses details length", () => {
  expect(validateStep(5, base)).toEqual({});
  const tooLong = "x".repeat(501);
  expect(validateStep(5, { ...base, accessInfo: tooLong }).accessInfo).toBeTruthy();
  expect(
    validateStep(5, {
      ...base,
      accessInfo: "ok",
      houseRules: "ok",
      extraInfo: "ok",
    }),
  ).toEqual({});
});

test("step 6 unique price", () => {
  const priced = { ...base, priceNight: 3500, priceFrom14: 3000, priceFrom28: 2800 };
  expect(validateStep(6, priced)).toEqual({});
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: "", base: 10 }] }).uniquePrices).toBeTruthy();
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: sampleDate, base: 0 }] }).uniquePrices).toBeTruthy();
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: sampleDate, base: 4000 }] })).toEqual({});
});

test("step 4 rejects non-finite maxGuests", () => {
  const ok = { ...base, maxGuests: 2, checkInTime: "14:00", checkOutTime: "12:00" };
  expect(validateStep(4, ok)).toEqual({});
  expect(validateStep(4, { ...ok, maxGuests: Number.NaN }).maxGuests).toBeTruthy();
  expect(validateStep(4, { ...ok, maxGuests: Number.POSITIVE_INFINITY }).maxGuests).toBeTruthy();
});

test("step 4 allows zero guests when guests forbidden", () => {
  const times = { checkInTime: "14:00", checkOutTime: "12:00" };
  expect(
    validateStep(4, {
      ...base,
      ...times,
      maxGuests: 0,
      guestsForbidden: true,
    }),
  ).toEqual({});
  expect(
    validateStep(4, {
      ...base,
      ...times,
      maxGuests: 0,
      guestsForbidden: false,
    }).maxGuests,
  ).toBeTruthy();
  expect(
    validateStep(4, {
      ...base,
      ...times,
      maxGuests: 2,
      guestsForbidden: true,
    }).maxGuests,
  ).toBeTruthy();
});

test("step 4 requires HH:MM clock times", () => {
  const ok = { ...base, maxGuests: 2, checkInTime: "14:00", checkOutTime: "12:00" };
  expect(validateStep(4, ok)).toEqual({});
  expect(validateStep(4, { ...ok, checkInTime: "14:0" }).checkInTime).toMatch(/ЧЧ:ММ/);
  expect(validateStep(4, { ...ok, checkOutTime: "25:00" }).checkOutTime).toMatch(/ЧЧ:ММ/);
  expect(validateStep(4, { ...ok, checkInTime: "" }).checkInTime).toMatch(/заезда/);
});

test("step 6 rejects non-finite prices", () => {
  const priced = { ...base, priceNight: 3500, priceFrom14: 3000, priceFrom28: 2800 };
  expect(validateStep(6, { ...priced, priceNight: Number.NaN }).priceNight).toBeTruthy();
  expect(validateStep(6, { ...priced, priceFrom14: Number.NaN }).priceFrom14).toBeTruthy();
  expect(validateStep(6, { ...priced, priceFrom28: Number.NaN }).priceFrom28).toBeTruthy();
  expect(
    validateStep(6, { ...priced, uniquePrices: [{ date: sampleDate, base: Number.NaN }] }).uniquePrices,
  ).toBeTruthy();
});
