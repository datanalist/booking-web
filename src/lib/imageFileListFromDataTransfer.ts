/** Единая причина изменения: выбор image/* из DataTransfer при drop. */

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function imageFileListFromDataTransfer(
  dataTransfer: DataTransfer,
): FileList | null {
  const transfer = new DataTransfer();
  for (const file of dataTransfer.files) {
    if (ACCEPTED_IMAGE_TYPES.has(file.type)) {
      transfer.items.add(file);
    }
  }
  return transfer.files.length > 0 ? transfer.files : null;
}
