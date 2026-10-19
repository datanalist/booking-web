import type { HousingType } from "../types";
import type { PbHousingType } from "./pbTypes";

const HOUSING_TYPES: readonly HousingType[] = [
  "apartment",
  "apartments",
  "studio",
  "house",
  "room",
];

const HOUSING_TYPE_TO_PB: Record<HousingType, PbHousingType> = {
  apartment: "Квартира",
  apartments: "Квартира",
  studio: "Квартира",
  house: "Дом",
  room: "Комната",
};

const PB_HOUSING_FALLBACK: Record<PbHousingType, HousingType> = {
  "Квартира": "apartment",
  "Дом": "house",
  "Комната": "room",
  "Отель": "apartment",
};

function isHousingType(value: string): value is HousingType {
  return HOUSING_TYPES.some((type) => type === value);
}

function isPbHousingType(value: string): value is PbHousingType {
  return Object.prototype.hasOwnProperty.call(PB_HOUSING_FALLBACK, value);
}

export function housingTypeToPb(type: HousingType): {
  housing_type: PbHousingType;
  placement_type: HousingType;
} {
  return {
    housing_type: HOUSING_TYPE_TO_PB[type],
    placement_type: type,
  };
}

export function housingTypeFromPb(
  housing_type: string,
  placement_type?: string,
): HousingType {
  const placement = placement_type?.trim() ?? "";
  if (isHousingType(placement)) {
    return placement;
  }
  if (isPbHousingType(housing_type)) {
    return PB_HOUSING_FALLBACK[housing_type];
  }
  return "apartment";
}
