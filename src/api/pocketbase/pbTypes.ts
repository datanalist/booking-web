import { AMENITY_LABELS, EXTRA_AMENITY_LABELS } from "../../config";
import type { AmenityId, ExtraAmenityId } from "../types";

export type PbUserRole = "guest" | "host" | "staff";

export type PbAccountStatus = "active" | "pending" | "blocked" | "rejected";

export type PbHousingType = "Квартира" | "Дом" | "Комната" | "Отель";

export type PbListingStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export type PbAmenityLabel = (typeof AMENITY_LABELS)[AmenityId];

export type PbExtraLabel = (typeof EXTRA_AMENITY_LABELS)[ExtraAmenityId];

export type PbGeoPoint = {
  lon: number;
  lat: number;
};

/** Запись коллекции `users` (`_pb_users_auth_`). */
export interface PbUserRecord {
  id: string;
  email: string;
  verified: boolean;
  name: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  phone: string;
  avatar: string;
  limited_browse: boolean;
  bio: string;
  roles: PbUserRole[];
  account_status: PbAccountStatus;
  verified_host: boolean;
  years_hosting: number;
  rating: number;
  reviews_count: number;
  balance: number;
  created: string;
  updated: string;
}

/**
 * Запись коллекции `listings`.
 * `unique_prices` — сырой JSON: разбор в `UniquePriceEntry[]` делает маппер.
 */
export interface PbListingRecord {
  id: string;
  host: string;
  title: string;
  city: string;
  address: string;
  geo: PbGeoPoint | null;
  housing_type: PbHousingType;
  placement_type: string;
  photos: string[];
  description: string;
  amenities: PbAmenityLabel[];
  extras: PbExtraLabel[];
  max_guests: number;
  pets_allowed: boolean;
  cancellation_allowed: boolean;
  guests_forbidden: boolean;
  access_info: string;
  house_rules: string;
  extra_info: string;
  check_in_time: string;
  check_out_time: string;
  price_night: number;
  price_14: number;
  price_28: number;
  unique_prices: unknown;
  status: PbListingStatus;
  reject_reason: string;
  rating: number;
  reviews_count: number;
  created: string;
  updated: string;
}

/** Запись коллекции `listing_blocks`. `end` — день после последнего занятого. */
export interface PbListingBlockRecord {
  id: string;
  listing: string;
  start: string;
  end: string;
}

/** Диапазон занятости из `/api/vallome/occupied-dates` и `listing_blocks`. */
export interface PbOccupiedRange {
  start: string;
  end: string;
}
