import { expect, test } from "vitest";
import {
  AVATAR_PHOTO_SCALE_DEFAULT,
  AVATAR_PHOTO_SCALE_MAX,
  AVATAR_PHOTO_SCALE_MIN,
  clampAvatarPhotoScale,
} from "./clampAvatarPhotoScale";

test("keeps value inside min and max", () => {
  expect(clampAvatarPhotoScale(1.5)).toBe(1.5);
  expect(clampAvatarPhotoScale(AVATAR_PHOTO_SCALE_MIN)).toBe(
    AVATAR_PHOTO_SCALE_MIN,
  );
  expect(clampAvatarPhotoScale(AVATAR_PHOTO_SCALE_MAX)).toBe(
    AVATAR_PHOTO_SCALE_MAX,
  );
});

test("clamps below min and above max", () => {
  expect(clampAvatarPhotoScale(0.5)).toBe(AVATAR_PHOTO_SCALE_MIN);
  expect(clampAvatarPhotoScale(10)).toBe(AVATAR_PHOTO_SCALE_MAX);
});

test("non-finite values fall back to default", () => {
  expect(clampAvatarPhotoScale(Number.NaN)).toBe(AVATAR_PHOTO_SCALE_DEFAULT);
  expect(clampAvatarPhotoScale(Number.POSITIVE_INFINITY)).toBe(
    AVATAR_PHOTO_SCALE_DEFAULT,
  );
});
