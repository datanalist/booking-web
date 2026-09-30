import { deletePhoto } from "./deletePhoto";
import { parsePhotoUrl } from "./PhotoUrl";

/**
 * Удаляет с сервера фото, которые исчезли из списка (только `/data/...`).
 * Ошибки сети глотаются — UI уже обновил список.
 */
export async function deleteRemovedWizardPhotos(
  previous: readonly string[],
  next: readonly string[],
): Promise<void> {
  const nextSet = new Set(next);
  const removals: Promise<void>[] = [];

  for (const url of previous) {
    if (nextSet.has(url)) {
      continue;
    }
    if (parsePhotoUrl(url) === null) {
      continue;
    }
    removals.push(deletePhoto(url));
  }

  await Promise.allSettled(removals);
}
