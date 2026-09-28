import type { ReactElement } from "react";

type ListingPreviewGalleryProps = {
  photos: string[];
};

/** Галерея предпросмотра: большое фото, превью, плитка «+N фото». */
export function ListingPreviewGallery({
  photos,
}: ListingPreviewGalleryProps): ReactElement {
  const hero = photos[0] ?? null;
  const thumbs = photos.slice(1, 4);
  const extraCount = Math.max(0, photos.length - 4);
  const overlaySrc = photos[4] ?? photos[3] ?? null;

  return (
    <div className="flex w-full max-w-[390px] shrink-0 flex-col gap-3">
      <div className="relative h-[264px] w-full overflow-hidden rounded-2xl bg-amber-400/10">
        {hero ? (
          <img
            src={hero}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        {thumbs.map((src, index) => (
          <div
            key={`thumb-${index}`}
            className="relative size-[calc(50%-6px)] min-h-[120px] min-w-[120px] flex-1 overflow-hidden rounded-xl bg-amber-400/10 sm:size-[189px] sm:flex-none"
          >
            <img
              src={src}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        ))}
        {extraCount > 0 && overlaySrc ? (
          <div className="relative flex size-[calc(50%-6px)] min-h-[120px] min-w-[120px] flex-1 items-center justify-center overflow-hidden rounded-xl sm:size-[189px] sm:flex-none">
            <img
              src={overlaySrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-[rgba(56,80,112,0.6)]" />
            <p className="relative m-0 text-[16px] leading-[1.45] text-white">
              +{extraCount} фото
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
