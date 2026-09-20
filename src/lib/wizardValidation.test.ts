import { expect, test } from "vitest";
import { validateStep } from "./wizardValidation";
import { emptyDraft } from "./emptyDraft";

const base = emptyDraft("u1");

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

test("step 6 unique price", () => {
  const priced = { ...base, priceNight: 3500, priceFrom14: 3000, priceFrom28: 2800 };
  expect(validateStep(6, priced)).toEqual({});
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: "", base: 10 }] }).uniquePrices).toBeTruthy();
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: "2026-01-01", base: 0 }] }).uniquePrices).toBeTruthy();
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: "2026-01-01", base: 4000 }] })).toEqual({});
});
