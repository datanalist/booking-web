import { clampAvatarPhotoScale } from "./clampAvatarPhotoScale";
import { centeredCoverDrawRect } from "./centeredCoverDrawRect";

export const AVATAR_CROP_SIZE = 400;

type CropCenteredAvatarOptions = {
  scale: number;
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
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas");
  }
  const rect = centeredCoverDrawRect(
    { width: bitmap.width, height: bitmap.height },
    size,
    scale,
  );
  ctx.drawImage(bitmap, rect.dx, rect.dy, rect.dw, rect.dh);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
