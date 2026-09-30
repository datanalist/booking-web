/** Текст ошибки после частичной или полной неудачи сжатия фото. */
export function photoUploadErrorMessage(
  failedCount: number,
  selectedCount: number,
): string {
  if (failedCount >= selectedCount) {
    return "Не удалось обработать фото. Попробуйте другие файлы.";
  }
  return `Не удалось обработать ${failedCount} из ${selectedCount} фото. Остальные добавлены.`;
}
