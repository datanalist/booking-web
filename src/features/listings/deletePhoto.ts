import { parsePhotoUrl } from "./PhotoUrl";
import { photoFileNameFromUrl } from "./photoFileNameFromUrl";

/**
 * Удаляет фото на сервере по PhotoUrl.
 * Legacy data-URL и прочие строки — no-op (нечего удалять).
 */
export async function deletePhoto(url: string): Promise<void> {
  const photoUrl = parsePhotoUrl(url);
  if (photoUrl === null) {
    return;
  }

  const name = photoFileNameFromUrl(photoUrl);
  const response = await fetch(`/api/files/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });

  if (response.ok || response.status === 404) {
    return;
  }

  throw new Error(`Delete failed with status ${response.status}`);
}
