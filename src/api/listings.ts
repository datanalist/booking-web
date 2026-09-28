import { createId } from "../lib/id";
import { emptyDraft } from "../lib/emptyDraft";
import { LISTINGS_KEY } from "./keys";
import type {
  Listing,
  ListingDraft,
  ListingEditSeed,
  ListingsApi,
} from "./types";

type ListingsError = Error & { code: "NOT_FOUND" };

function notFound(): ListingsError {
  return Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" as const });
}

export function createListingsApi(
  storage: Storage,
  getUserId: () => string | null,
): ListingsApi {
  const readListings = (): Listing[] => {
    const value = storage.getItem(LISTINGS_KEY);
    return value ? JSON.parse(value) as Listing[] : [];
  };

  const writeListings = (listings: Listing[]): void => {
    storage.setItem(LISTINGS_KEY, JSON.stringify(listings));
  };

  const findOwned = (listings: Listing[], id: string): [Listing, number] => {
    const userId = getUserId();
    const index = listings.findIndex(
      (listing) => listing.id === id && listing.ownerId === userId,
    );
    if (index < 0) {
      throw notFound();
    }
    return [listings[index], index];
  };

  return {
    async list({ tab, query }) {
      const userId = getUserId();
      if (!userId || tab === "published") {
        return [];
      }

      const normalizedQuery = query.trim().toLowerCase();
      return readListings().filter((listing) => {
        if (listing.ownerId !== userId) {
          return false;
        }
        if (tab !== "all" && listing.status !== tab) {
          return false;
        }
        return !normalizedQuery
          || listing.title.toLowerCase().includes(normalizedQuery)
          || listing.address.toLowerCase().includes(normalizedQuery);
      });
    },

    async get(id) {
      const [listing] = findOwned(readListings(), id);
      return listing;
    },

    async ensureForEdit(input: ListingEditSeed) {
      const userId = getUserId();
      if (!userId) {
        throw notFound();
      }
      const listings = readListings();
      const existing = listings.find(
        (listing) => listing.id === input.id && listing.ownerId === userId,
      );
      if (existing) {
        return existing;
      }
      const listing: Listing = {
        ...emptyDraft(userId),
        id: input.id,
        ownerId: userId,
        title: input.title,
        address: input.address,
        housingType: input.housingType,
        status: "draft",
        updatedAt: new Date().toISOString(),
      };
      writeListings([...listings, listing]);
      return listing;
    },

    async saveDraft(draft: ListingDraft) {
      const userId = getUserId();
      if (!userId || draft.ownerId !== userId) {
        throw notFound();
      }
      if (draft.status === "published") {
        throw new Error("INVALID_STATUS");
      }

      const listings = readListings();
      const updatedAt = new Date().toISOString();
      if (!draft.id) {
        const listing: Listing = {
          ...draft,
          id: createId(),
          ownerId: userId,
          status: "draft",
          updatedAt,
        };
        writeListings([...listings, listing]);
        return listing;
      }

      const [existing, index] = findOwned(listings, draft.id);
      if (existing.status === "published") {
        throw new Error("INVALID_STATUS");
      }
      const listing: Listing = {
        ...draft,
        id: existing.id,
        ownerId: existing.ownerId,
        status: existing.status,
        updatedAt,
      };
      listings[index] = listing;
      writeListings(listings);
      return listing;
    },

    async submitForModeration(id) {
      const listings = readListings();
      const [existing, index] = findOwned(listings, id);
      if (existing.status === "published") {
        throw new Error("INVALID_STATUS");
      }
      const listing: Listing = {
        ...existing,
        status: "moderation",
        updatedAt: new Date().toISOString(),
      };
      listings[index] = listing;
      writeListings(listings);
      return listing;
    },

    async archive(id) {
      const listings = readListings();
      const [existing, index] = findOwned(listings, id);
      const listing: Listing = {
        ...existing,
        status: "archived",
        updatedAt: new Date().toISOString(),
      };
      listings[index] = listing;
      writeListings(listings);
      return listing;
    },

    async remove(id) {
      const listings = readListings();
      const [, index] = findOwned(listings, id);
      listings.splice(index, 1);
      writeListings(listings);
    },
  };
}
