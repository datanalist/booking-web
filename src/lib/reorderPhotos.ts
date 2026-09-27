/** Единая причина изменения: перестановка фото в массиве шага мастера. */

export function reorderPhotos(
  photos: readonly string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= photos.length ||
    toIndex >= photos.length
  ) {
    return [...photos];
  }

  const next = [...photos];
  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) {
    return [...photos];
  }
  next.splice(toIndex, 0, moved);
  return next;
}
