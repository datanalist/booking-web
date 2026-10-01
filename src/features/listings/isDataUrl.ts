/** True for data: URLs (в т.ч. base64-фото), которые нельзя класть в localStorage. */
export function isDataUrl(value: string): boolean {
  return value.trimStart().toLowerCase().startsWith("data:");
}
