import type { AmenityId, ExtraAmenityId, HousingType } from "../../api/types";
import type { IsoDate } from "../../lib/isoDate";
import { parseIsoDate } from "../../lib/isoDate";

function requireIsoDate(raw: string): IsoDate {
  const parsed = parseIsoDate(raw);
  if (parsed === null) {
    throw new Error(`Invalid demo ISO date: ${raw}`);
  }
  return parsed;
}

/** Макетные значения Figma 1:20382 — fallback, если в черновике поле ещё пустое. */
export const LISTING_PREVIEW_DEMO = {
  title: "Уютная студия в центре Москвы",
  address: "Москва, ул. Невская 48",
  housingType: "apartment" as HousingType,
  description:
    "Современное и комфортное жилье в шаговой доступности от главных достопримечательностей города. В студии есть двуспальная кровать, зона отдыха с диваном, кухня с необходимой техникой и ванная комната.Высокоскоростной Wi-Fi и круглосуточное заселение сделают ваше пребывание удобным и приятным.",
  amenityIds: [
    "wifi",
    "tv",
    "ac",
    "hairdryer",
    "iron",
    "kitchen",
    "washer",
    "dishes",
  ] as AmenityId[],
  extraAmenityIds: [
    "breakfast",
    "pool",
    "fireplace",
    "gym",
    "sauna",
    "parking",
  ] as ExtraAmenityId[],
  maxGuests: 4,
  petsAllowed: true,
  checkInTime: "14:00",
  checkOutTime: "12:00",
  accessInfoLines: [
    "Введите код домофона 3486",
    "Поднимитесь на 4 этаж",
    "Введите код на двери 846395",
  ],
  houseRulesLines: [
    "Максимум 4 гостя",
    "Не включать громко музыку или теливизор после 22:00",
    "Не курить",
    "Нельзя с животными",
  ],
  priceNight: 3500,
  priceFrom14: 3100,
  priceFrom28: 3100,
  uniquePrices: [
    { date: requireIsoDate("2025-02-14"), base: 4000 },
    { date: requireIsoDate("2025-05-01"), base: 4200 },
  ],
} as const;
