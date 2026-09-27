import type { HousingType } from "../api/types";
import { DESCRIPTION_MAX, HOUSING_LABELS } from "../config";

const HOUSING_TYPES = new Set<string>(Object.keys(HOUSING_LABELS));

export type DescriptionStepInput = {
  title: string;
  address: string;
  housingType: string;
  housingChosen: boolean;
  description: string;
};

export type DescriptionStepValues = {
  title: string;
  address: string;
  housingType: HousingType;
  description: string;
};

export type DescriptionStepParseResult =
  | { ok: true; value: DescriptionStepValues }
  | { ok: false; errors: Record<string, string> };

function isHousingType(value: string): value is HousingType {
  return HOUSING_TYPES.has(value);
}

/** Parse, don't validate: returns typed values only when step 1 is complete. */
export function parseDescriptionStep(
  input: DescriptionStepInput,
): DescriptionStepParseResult {
  const errors: Record<string, string> = {};
  const title = input.title.trim();
  const address = input.address.trim();
  const description = input.description.trim();

  if (!title) {
    errors.title = "Укажите название";
  }
  if (!address) {
    errors.address = "Укажите адрес";
  }
  if (!input.housingChosen || !isHousingType(input.housingType)) {
    errors.housingType = "Выберите вид жилья";
  }
  if (!description) {
    errors.description = "Укажите описание";
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `Не более ${DESCRIPTION_MAX} символов`;
  }

  if (Object.keys(errors).length > 0 || !isHousingType(input.housingType)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      title,
      address,
      housingType: input.housingType,
      description,
    },
  };
}

export function isDescriptionStepComplete(input: DescriptionStepInput): boolean {
  return parseDescriptionStep(input).ok;
}
