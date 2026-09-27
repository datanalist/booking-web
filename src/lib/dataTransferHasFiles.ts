/** Проверка, что drag содержит файлы (для drop-зоны загрузки). */
export function dataTransferHasFiles(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes("Files");
}
