import { listingPreviewPhotosWithCover } from "./listingPreviewPhotosWithCover";

/**
 * Фото предпросмотра. Единственный источник — `photos` сохранённого объявления:
 * порядок и состав не меняются ни статусом строки таблицы, ни обложкой.
 * Только если у объявления нет фото (мок-строка списка), берём обложку строки + демо-фото.
 */
export function resolveListingPhotos(
  ownPhotos: readonly string[],
  coverUrl: string | undefined,
  fallbackPhotos: readonly string[],
): string[] {
  if (ownPhotos.length > 0) {
    return [...ownPhotos];
  }
  return listingPreviewPhotosWithCover(coverUrl, fallbackPhotos);
}
