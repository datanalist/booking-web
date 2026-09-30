/**
 * Первое фото галереи — обложка строки таблицы; остальные без дубля этой обложки.
 */
export function listingPreviewPhotosWithCover(
  coverUrl: string | undefined,
  photos: readonly string[],
): string[] {
  if (coverUrl === undefined || coverUrl.trim().length === 0) {
    return [...photos];
  }
  const rest = [...photos];
  const coverIndex = rest.indexOf(coverUrl);
  if (coverIndex >= 0) {
    rest.splice(coverIndex, 1);
  }
  return [coverUrl, ...rest];
}
