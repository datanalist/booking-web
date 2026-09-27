import { expect, test } from "vitest";
import { clampAvatarPhotoOffset } from "./clampAvatarPhotoOffset";

test("zero offset stays at center when image fills exactly", () => {
  expect(
    clampAvatarPhotoOffset({ width: 100, height: 100 }, 50, 1, { x: 10, y: -5 }),
  ).toEqual({ x: 0, y: 0 });
});

test("clamps pan to keep cover fill when zoomed", () => {
  expect(
    clampAvatarPhotoOffset({ width: 100, height: 100 }, 50, 2, {
      x: 100,
      y: -100,
    }),
  ).toEqual({ x: 25, y: -25 });
});

test("allows horizontal pan for wide image at scale 1", () => {
  expect(
    clampAvatarPhotoOffset({ width: 200, height: 100 }, 100, 1, {
      x: -80,
      y: 20,
    }),
  ).toEqual({ x: -50, y: 0 });
});
