type IsWizardPhotosNextDisabledInput = {
  photoCount: number;
  minPhotos: number;
  savePending: boolean;
};

/**
 * «Далее» доступна при ≥ min фото (в т.ч. во время догрузки новых).
 * Без минимума недоступна — пока идёт обработка, новые кадры ещё не в списке.
 */
export function isWizardPhotosNextDisabled(
  input: IsWizardPhotosNextDisabledInput,
): boolean {
  return input.savePending || input.photoCount < input.minPhotos;
}
