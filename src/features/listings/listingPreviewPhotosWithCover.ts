/**
 * Первое фото галереи — обложка строки таблицы; остальные без дубля обложки.
 */
export function listingPreviewPhotosWithCover(
  coverUrl: string | undefined,
  photos: readonly string[],
): string[] {
  if (coverUrl === undefined || coverUrl.trim().length === 0) {
    return [...photos];
  }
  const rest = photos.filter((photo) => photo !== coverUrl);
  return [coverUrl, ...rest];
}
