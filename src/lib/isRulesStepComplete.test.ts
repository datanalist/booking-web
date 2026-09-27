import { expect, test } from "vitest";
import { isRulesStepComplete } from "./isRulesStepComplete";

test("rules step incomplete until guests and times filled", () => {
  expect(
    isRulesStepComplete({
      maxGuests: 0,
      checkInTime: "",
      checkOutTime: "",
    }),
  ).toBe(false);
  expect(
    isRulesStepComplete({
      maxGuests: 4,
      checkInTime: "14:00",
      checkOutTime: "",
    }),
  ).toBe(false);
  expect(
    isRulesStepComplete({
      maxGuests: 4,
      checkInTime: "14:00",
      checkOutTime: "12:00",
    }),
  ).toBe(true);
});
