import { PHOTO_MAX } from "../../config";
import { compressWizardPhotoFiles } from "./compressWizardPhotoFiles";
import { PHOTO_UPLOAD_IDLE, type PhotoUploadStatus } from "./PhotoUploadStatus";
import { photoUploadErrorMessage } from "./photoUploadErrorMessage";

export type ProcessWizardPhotoSelectionResult = {
  addedPhotos: string[];
  status: PhotoUploadStatus;
};

type CompressFn = (file: File) => Promise<Blob>;
type UploadFn = (blob: Blob) => Promise<string>;

/**
 * Обрабатывает выбор файлов: сжимает, загружает на /api/files, считает ошибки, никогда не бросает.
 */
export async function processWizardPhotoSelection(
  files: readonly File[],
  currentPhotoCount: number,
  compress?: CompressFn,
  upload?: UploadFn,
): Promise<ProcessWizardPhotoSelectionResult> {
  const remaining = PHOTO_MAX - currentPhotoCount;
  if (remaining <= 0 || files.length === 0) {
    return { addedPhotos: [], status: PHOTO_UPLOAD_IDLE };
  }

  const selected = files.slice(0, remaining);
  const { photos, failedCount } = await compressWizardPhotoFiles(
    selected,
    compress,
    upload,
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
