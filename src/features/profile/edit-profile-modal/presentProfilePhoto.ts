export function presentProfilePhoto(
  photoUrl: string | undefined,
): string | undefined {
  const trimmed = photoUrl?.trim() ?? "";
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed;
}
