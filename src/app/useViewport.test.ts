import { expect, test } from "vitest";
import { isDesktopSurface, isDesktopWidth } from "./useViewport";

test("1279 is mobile gate", () => {
  expect(isDesktopWidth(1279)).toBe(false);
  expect(isDesktopWidth(1280)).toBe(true);
});

test("zoomed desktop window stays on the scaled canvas", () => {
  expect(isDesktopSurface(960, 1920)).toBe(true);
  expect(isDesktopSurface(390, 390)).toBe(false);
});
