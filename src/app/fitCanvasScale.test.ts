import { expect, test } from "vitest";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../config";
import { fitCanvasScale } from "./fitCanvasScale";

test("fits the limiting side and can grow past 1", () => {
  expect(fitCanvasScale(CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(1);
  expect(fitCanvasScale(CANVAS_WIDTH * 2, CANVAS_HEIGHT * 2)).toBe(2);
  expect(fitCanvasScale(1280, 800)).toBeCloseTo(800 / CANVAS_HEIGHT);
  expect(fitCanvasScale(1920, 1080)).toBeCloseTo(1080 / CANVAS_HEIGHT);
});

test("ignores a zero viewport", () => {
  expect(fitCanvasScale(0, 800)).toBe(1);
});
