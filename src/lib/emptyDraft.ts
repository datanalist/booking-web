import type { ListingDraft } from "../api/types";

export function emptyDraft(ownerId: string): ListingDraft {
  return {
    ownerId,
    status: "draft",
    title: "",
    address: "",
    housingType: "apartment",
    description: "",
    photos: [],
    amenityIds: [],
    extraAmenityIds: [],
    maxGuests: 0,
    petsAllowed: false,
    cancellationAllowed: false,
    checkInTime: "",
    checkOutTime: "",
    accessInfo: "",
    houseRules: "",
    extraInfo: "",
    priceNight: 0,
    priceFrom14: 0,
    priceFrom28: 0,
    uniquePrices: [],
    updatedAt: "",
  };
}
