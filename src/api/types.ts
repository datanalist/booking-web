import type { IsoDate } from "../lib/isoDate";

export type ListingStatus = "draft" | "moderation" | "published" | "archived";

export type HousingType = "apartment" | "apartments" | "studio" | "house" | "room";

export type AmenityId =
  | "wifi" | "tv" | "ac" | "heater" | "hairdryer"
  | "iron" | "kitchen" | "washer" | "dishes";

export type ExtraAmenityId =
  | "breakfast" | "pool" | "fireplace" | "smoking"
  | "gym" | "selfCheckIn" | "sauna" | "parking";

export type UniquePriceEntry = {
  date: IsoDate | "";
  base: number;
};

export interface Session {
  userId: string;
  email: string;
  name: string;
  phone: string;
  photoUrl?: string;
  onboardingComplete: boolean;
}

export interface Listing {
  id: string;
  ownerId: string;
  status: ListingStatus;
  title: string;
  address: string;
  housingType: HousingType;
  description: string;
  photos: string[];
  amenityIds: AmenityId[];
  extraAmenityIds: ExtraAmenityId[];
  maxGuests: number;
  guestsForbidden: boolean;
  petsAllowed: boolean;
  cancellationAllowed: boolean;
  checkInTime: string;
  checkOutTime: string;
  accessInfo: string;
  houseRules: string;
  extraInfo: string;
  priceNight: number;
  priceFrom14: number;
  priceFrom28: number;
  uniquePrices: UniquePriceEntry[];
  updatedAt: string;
}

export type ListingDraft = Omit<Listing, "id"> & { id?: string };

export interface AuthApi {
  register(email: string, password: string): Promise<Session>;
  login(email: string, password: string): Promise<Session>;
  logout(): Promise<void>;
  completeOnboarding(input: { name: string; phone: string; photo?: string }): Promise<Session>;
  requestPasswordReset(email: string): Promise<string>;
  confirmPasswordReset(token: string, password: string): Promise<void>;
}

export type ListingEditSeed = {
  id: string;
  title: string;
  address: string;
  housingType: HousingType;
};

export interface ListingsApi {
  list(filter: {
    tab: "all" | "published" | "moderation" | "archived";
    query: string;
  }): Promise<Listing[]>;
  get(id: string): Promise<Listing>;
  /** Создаёт draft с заданным id, если объявления ещё нет (мок-строки таблицы → мастер). */
  ensureForEdit(input: ListingEditSeed): Promise<Listing>;
  saveDraft(listing: ListingDraft): Promise<Listing>;
  submitForModeration(id: string): Promise<Listing>;
  archive(id: string): Promise<Listing>;
  remove(id: string): Promise<void>;
}

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  photoUrl?: string;
  onboardingComplete: boolean;
};
