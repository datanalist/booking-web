import { centeredCoverDrawRect } from "./centeredCoverDrawRect";
import {
  clampAvatarPhotoOffset,
  type AvatarPhotoOffset,
} from "./clampAvatarPhotoOffset";
import { clampAvatarPhotoScale } from "./clampAvatarPhotoScale";

export const AVATAR_CROP_SIZE = 400;

type CropCenteredAvatarOptions = {
  scale: number;
  offset?: AvatarPhotoOffset;
  size?: number;
};

export async function cropCenteredAvatar(
  sourceDataUrl: string,
  options: CropCenteredAvatarOptions,
): Promise<string> {
  const size = options.size ?? AVATAR_CROP_SIZE;
  const scale = clampAvatarPhotoScale(options.scale);
  const response = await fetch(sourceDataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const image = { width: bitmap.width, height: bitmap.height };
  const offset = clampAvatarPhotoOffset(
    image,
    size,
    scale,
    options.offset ?? { x: 0, y: 0 },
  );
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas");
  }
  const rect = centeredCoverDrawRect(image, size, scale, offset);
  ctx.drawImage(bitmap, rect.dx, rect.dy, rect.dw, rect.dh);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
