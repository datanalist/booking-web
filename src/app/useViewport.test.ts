import { expect, test } from "vitest";
import { isDesktopWidth } from "./useViewport";

test("1279 is mobile gate", () => {
  expect(isDesktopWidth(1279)).toBe(false);
  expect(isDesktopWidth(1280)).toBe(true);
});
