import type { ReactElement } from "react";
import { listingPreviewGalleryTiles } from "./listingPreviewGalleryTiles";

type ListingPreviewGalleryProps = {
  photos: string[];
};

/** Галерея предпросмотра: главное фото + сетка 2×N миниатюр, плитка «+N фото». */
export function ListingPreviewGallery({
  photos,
}: ListingPreviewGalleryProps): ReactElement {
  const { hero, tiles } = listingPreviewGalleryTiles(photos);

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
      {tiles.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-3"
          data-testid="listing-preview-thumbs"
        >
          {tiles.map((tile, index) =>
            tile.kind === "photo" ? (
              <div
                key={`thumb-${index}`}
                className="relative aspect-square w-full overflow-hidden rounded-xl bg-amber-400/10"
              >
                <img
                  src={tile.src}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
            ) : (
              <div
                key={`thumb-extra-${index}`}
                className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl"
                data-testid="listing-preview-extra-photos"
              >
                <img
                  src={tile.src}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-600/60" />
                <p className="relative m-0 text-base leading-normal text-white">
                  +{tile.count} фото
                </p>
              </div>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
