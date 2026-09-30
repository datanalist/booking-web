import { compressImage } from "../../lib/compressImage";
import { uploadPhoto } from "./uploadPhoto";

export type CompressWizardPhotoFilesResult = {
  photos: string[];
  failedCount: number;
};

type CompressFn = (file: File) => Promise<Blob>;
type UploadFn = (blob: Blob) => Promise<string>;

/**
 * Сжимает и загружает выбранные файлы по одному: ошибка одного не отменяет остальные.
 * В localStorage попадают только URL `/data/...`, не base64.
 */
export async function compressWizardPhotoFiles(
  files: readonly File[],
  compress: CompressFn = compressImage,
  upload: UploadFn = uploadPhoto,
): Promise<CompressWizardPhotoFilesResult> {
  const photos: string[] = [];
  let failedCount = 0;

  for (const file of files) {
    try {
      const blob = await compress(file);
      photos.push(await upload(blob));
    } catch {
      failedCount += 1;
    }
  }

  return { photos, failedCount };
}
