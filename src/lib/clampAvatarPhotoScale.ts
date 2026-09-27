export const AVATAR_PHOTO_SCALE_MIN = 1;
export const AVATAR_PHOTO_SCALE_MAX = 3;
export const AVATAR_PHOTO_SCALE_DEFAULT = 1;

export function clampAvatarPhotoScale(value: number): number {
  if (!Number.isFinite(value)) {
    return AVATAR_PHOTO_SCALE_DEFAULT;
  }
  return Math.min(
    AVATAR_PHOTO_SCALE_MAX,
    Math.max(AVATAR_PHOTO_SCALE_MIN, value),
  );
}
