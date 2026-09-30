import { compressImage } from "../../lib/compressImage";

export type CompressWizardPhotoFilesResult = {
  photos: string[];
  failedCount: number;
};

type CompressFn = (file: File) => Promise<string>;

/**
 * Сжимает выбранные файлы по одному: ошибка одного не отменяет остальные.
 */
export async function compressWizardPhotoFiles(
  files: readonly File[],
  compress: CompressFn = compressImage,
): Promise<CompressWizardPhotoFilesResult> {
  const photos: string[] = [];
  let failedCount = 0;

  for (const file of files) {
    try {
      photos.push(await compress(file));
    } catch {
      failedCount += 1;
    }
  }

  return { photos, failedCount };
}
