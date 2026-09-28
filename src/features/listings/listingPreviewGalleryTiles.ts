export type ListingPreviewGalleryPhotoTile = {
  kind: "photo";
  src: string;
};

export type ListingPreviewGalleryExtraTile = {
  kind: "extra";
  src: string;
  count: number;
};

export type ListingPreviewGalleryTile =
  | ListingPreviewGalleryPhotoTile
  | ListingPreviewGalleryExtraTile;

export type ListingPreviewGalleryLayout = {
  hero: string | null;
  tiles: ListingPreviewGalleryTile[];
};

/**
 * Главное фото + до 3 миниатюр; при photos.length > 4 четвёртая плитка — «+N фото».
 */
export function listingPreviewGalleryTiles(
  photos: readonly string[],
): ListingPreviewGalleryLayout {
  const hero = photos[0] ?? null;
  const extraCount = Math.max(0, photos.length - 4);

  if (extraCount > 0) {
    const overlaySrc = photos[4] ?? photos[3];
    if (overlaySrc === undefined) {
      return { hero, tiles: [] };
    }
    const photoTiles: ListingPreviewGalleryPhotoTile[] = photos
      .slice(1, 4)
      .map((src) => ({ kind: "photo", src }));
    return {
      hero,
      tiles: [
        ...photoTiles,
        { kind: "extra", src: overlaySrc, count: extraCount },
      ],
    };
  }

  const tiles: ListingPreviewGalleryPhotoTile[] = photos
    .slice(1, 4)
    .map((src) => ({ kind: "photo", src }));
  return { hero, tiles };
}
