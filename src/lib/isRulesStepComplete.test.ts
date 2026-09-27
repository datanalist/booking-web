import { expect, test } from "vitest";
import { isRulesStepComplete } from "./isRulesStepComplete";

test("rules step incomplete until guests and times filled", () => {
  expect(
    isRulesStepComplete({
      maxGuests: 0,
      guestsForbidden: false,
      checkInTime: "",
      checkOutTime: "",
    }),
  ).toBe(false);
  expect(
    isRulesStepComplete({
      maxGuests: 4,
      guestsForbidden: false,
      checkInTime: "14:00",
      checkOutTime: "",
    }),
  ).toBe(false);
  expect(
    isRulesStepComplete({
      maxGuests: 4,
      guestsForbidden: false,
      checkInTime: "14:0",
      checkOutTime: "12:00",
    }),
  ).toBe(false);
  expect(
    isRulesStepComplete({
      maxGuests: 4,
      guestsForbidden: false,
      checkInTime: "14:00",
      checkOutTime: "12:00",
    }),
  ).toBe(true);
});

test("rules step complete with zero guests when guests forbidden", () => {
  expect(
    isRulesStepComplete({
      maxGuests: 0,
      guestsForbidden: true,
      checkInTime: "14:00",
      checkOutTime: "12:00",
    }),
  ).toBe(true);
  expect(
    isRulesStepComplete({
      maxGuests: 0,
      guestsForbidden: false,
      checkInTime: "14:00",
      checkOutTime: "12:00",
    }),
  ).toBe(false);
  expect(
    isRulesStepComplete({
      maxGuests: 2,
      guestsForbidden: true,
      checkInTime: "14:00",
      checkOutTime: "12:00",
    }),
  ).toBe(false);
});
