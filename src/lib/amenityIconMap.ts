import type { LucideIcon } from "lucide-react";
import {
  AirVent,
  Bath,
  Cigarette,
  CircleParking,
  Coffee,
  Dumbbell,
  Fan,
  Flame,
  Heater,
  KeyRound,
  Refrigerator,
  Shirt,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  Wifi,
} from "lucide-react";
import type { AmenityId, ExtraAmenityId } from "../api/types";

export const AMENITY_ICONS: Record<AmenityId, LucideIcon> = {
  wifi: Wifi,
  tv: Tv,
  ac: AirVent,
  heater: Heater,
  hairdryer: Fan,
  iron: Shirt,
  kitchen: Refrigerator,
  washer: WashingMachine,
  dishes: UtensilsCrossed,
};

export const EXTRA_AMENITY_ICONS: Record<ExtraAmenityId, LucideIcon> = {
  breakfast: Coffee,
  pool: Waves,
  fireplace: Flame,
  smoking: Cigarette,
  gym: Dumbbell,
  selfCheckIn: KeyRound,
  sauna: Bath,
  parking: CircleParking,
};
