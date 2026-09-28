import type { ReactElement } from "react";

type ListingPreviewGalleryProps = {
  photos: string[];
};

/** Галерея предпросмотра: большое фото, превью 48, плитка «+N фото». */
export function ListingPreviewGallery({
  photos,
}: ListingPreviewGalleryProps): ReactElement {
  const hero = photos[0] ?? null;
  const thumbs = photos.slice(1, 4);
  const extraCount = Math.max(0, photos.length - 4);
  const overlaySrc = photos[4] ?? photos[3] ?? null;

  return (
    <div className="flex w-96 shrink-0 flex-col gap-3">
      <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-amber-400/10">
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
            className="relative size-48 shrink-0 overflow-hidden rounded-xl bg-amber-400/10"
          >
            <img
              src={src}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        ))}
        {extraCount > 0 && overlaySrc ? (
          <div
            className="relative flex size-48 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            data-testid="listing-preview-extra-photos"
          >
            <img
              src={overlaySrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-600/60" />
            <p className="relative m-0 text-base leading-normal text-white">
              +{extraCount} фото
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
