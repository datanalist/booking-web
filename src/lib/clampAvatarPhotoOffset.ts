import type { ImageSize } from "./centeredCoverDrawRect";
import { clampAvatarPhotoScale } from "./clampAvatarPhotoScale";

export type AvatarPhotoOffset = {
  x: number;
  y: number;
};

/** Clamps pan so the cover-scaled image still fills the square crop. */
export function clampAvatarPhotoOffset(
  image: ImageSize,
  outputSize: number,
  scale: number,
  offset: AvatarPhotoOffset,
): AvatarPhotoOffset {
  const safeScale = clampAvatarPhotoScale(scale);
  const cover = Math.max(outputSize / image.width, outputSize / image.height);
  const effective = cover * safeScale;
  const dw = image.width * effective;
  const dh = image.height * effective;
  const maxX = Math.max(0, (dw - outputSize) / 2);
  const maxY = Math.max(0, (dh - outputSize) / 2);
  const x = Math.min(maxX, Math.max(-maxX, offset.x));
  const y = Math.min(maxY, Math.max(-maxY, offset.y));
  return {
    x: Object.is(x, -0) ? 0 : x,
    y: Object.is(y, -0) ? 0 : y,
  };
}
