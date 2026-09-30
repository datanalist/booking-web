import { PHOTO_MAX } from "../../config";
import { compressWizardPhotoFiles } from "./compressWizardPhotoFiles";
import { PHOTO_UPLOAD_IDLE, type PhotoUploadStatus } from "./PhotoUploadStatus";
import { photoUploadErrorMessage } from "./photoUploadErrorMessage";

export type ProcessWizardPhotoSelectionResult = {
  addedPhotos: string[];
  status: PhotoUploadStatus;
};

type CompressFn = (file: File) => Promise<string>;

/**
 * Обрабатывает выбор файлов: сжимает, считает ошибки, никогда не бросает.
 */
export async function processWizardPhotoSelection(
  files: readonly File[],
  currentPhotoCount: number,
  compress?: CompressFn,
): Promise<ProcessWizardPhotoSelectionResult> {
  const remaining = PHOTO_MAX - currentPhotoCount;
  if (remaining <= 0 || files.length === 0) {
    return { addedPhotos: [], status: PHOTO_UPLOAD_IDLE };
  }

  const selected = files.slice(0, remaining);
  const { photos, failedCount } = await compressWizardPhotoFiles(
    selected,
    compress,
  );

  if (failedCount === 0) {
    return { addedPhotos: photos, status: PHOTO_UPLOAD_IDLE };
  }

  return {
    addedPhotos: photos,
    status: {
      kind: "error",
      message: photoUploadErrorMessage(failedCount, selected.length),
    },
  };
}
