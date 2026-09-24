import {
  AVATAR_PHOTO_SCALE_MAX,
  AVATAR_PHOTO_SCALE_MIN,
  clampAvatarPhotoScale,
} from "../lib/clampAvatarPhotoScale";

type AvatarPhotoScaleControlProps = {
  value: number;
  onChange: (value: number) => void;
};

export function AvatarPhotoScaleControl({
  value,
  onChange,
}: AvatarPhotoScaleControlProps) {
  return (
    <label className="flex w-[160px] flex-col items-stretch gap-1">
      <span className="text-center text-[12px] leading-[1.3] text-[var(--color-ink)]">
        Масштаб
      </span>
      <input
        type="range"
        min={AVATAR_PHOTO_SCALE_MIN}
        max={AVATAR_PHOTO_SCALE_MAX}
        step={0.05}
        value={value}
        aria-label="Масштаб фото"
        className="w-full accent-[#f88a2a]"
        onChange={(event) => {
          onChange(clampAvatarPhotoScale(Number(event.target.value)));
        }}
      />
    </label>
  );
}
