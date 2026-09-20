import type { ListingDraft } from "../api/types";
import { DESCRIPTION_MAX, HOUSING_LABELS, PHOTO_MAX, PHOTO_MIN } from "../config";

const HOUSING_TYPES = new Set<string>(Object.keys(HOUSING_LABELS));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function validateStep1(draft: ListingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.title.trim()) {
    errors.title = "Укажите название";
  }
  if (!draft.address.trim()) {
    errors.address = "Укажите адрес";
  }
  const descriptionLen = draft.description.trim().length;
  if (descriptionLen < 1) {
    errors.description = "Укажите описание";
  } else if (descriptionLen > DESCRIPTION_MAX) {
    errors.description = `Не более ${DESCRIPTION_MAX} символов`;
  }
  if (!HOUSING_TYPES.has(draft.housingType)) {
    errors.housingType = "Выберите вид жилья";
  }
  return errors;
}

function validateStep2(draft: ListingDraft): Record<string, string> {
  const len = draft.photos.length;
  if (len >= PHOTO_MIN && len <= PHOTO_MAX) {
    return {};
  }
  if (len < PHOTO_MIN) {
    return { photos: `Добавьте ещё ${PHOTO_MIN - len} фото` };
  }
  return { photos: `Не более ${PHOTO_MAX} фото` };
}

function validateStep4(draft: ListingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.maxGuests < 1) {
    errors.maxGuests = "Укажите число гостей";
  }
  if (!draft.checkInTime.trim()) {
    errors.checkInTime = "Укажите время заезда";
  }
  if (!draft.checkOutTime.trim()) {
    errors.checkOutTime = "Укажите время выезда";
  }
  return errors;
}

function validateStep5(draft: ListingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.accessInfo.length > DESCRIPTION_MAX) {
    errors.accessInfo = `Не более ${DESCRIPTION_MAX} символов`;
  }
  if (draft.houseRules.length > DESCRIPTION_MAX) {
    errors.houseRules = `Не более ${DESCRIPTION_MAX} символов`;
  }
  if (draft.extraInfo.length > DESCRIPTION_MAX) {
    errors.extraInfo = `Не более ${DESCRIPTION_MAX} символов`;
  }
  return errors;
}

function validateStep6(draft: ListingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.priceNight <= 0) {
    errors.priceNight = "Укажите цену";
  }
  if (draft.priceFrom14 <= 0) {
    errors.priceFrom14 = "Укажите цену";
  }
  if (draft.priceFrom28 <= 0) {
    errors.priceFrom28 = "Укажите цену";
  }
  if (draft.uniquePrices.length > 0) {
    const invalid = draft.uniquePrices.some(
      (entry) => !entry.date.trim() || entry.base <= 0 || !isValidDateString(entry.date),
    );
    if (invalid) {
      errors.uniquePrices = "Проверьте уникальные цены";
    }
  }
  return errors;
}

export function validateStep(
  step: 1 | 2 | 3 | 4 | 5 | 6,
  draft: ListingDraft,
): Record<string, string> {
  switch (step) {
    case 1:
      return validateStep1(draft);
    case 2:
      return validateStep2(draft);
    case 3:
      return {};
    case 4:
      return validateStep4(draft);
    case 5:
      return validateStep5(draft);
    case 6:
      return validateStep6(draft);
  }
}
