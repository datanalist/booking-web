import { expect, test } from "vitest";
import { confirmedBookingId } from "../ConfirmedBookingId";
import { toggleOpenMenu } from "./toggleOpenMenu";

const A = confirmedBookingId("a");
const B = confirmedBookingId("b");

test("opens the clicked row's menu when none is open", () => {
  expect(toggleOpenMenu(null, A)).toBe(A);
});

test("closes the menu when its own trigger is clicked again", () => {
  expect(toggleOpenMenu(A, A)).toBeNull();
});

test("moves the single open menu to another row, closing the previous one", () => {
  expect(toggleOpenMenu(A, B)).toBe(B);
  expect(toggleOpenMenu(toggleOpenMenu(A, B), A)).toBe(A);
});
