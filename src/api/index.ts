import { createAuthApi } from "./auth";
import { createListingsApi } from "./listings";
import { SESSION_KEY } from "./keys";
import { resolveCabinetDataSource } from "./pocketbase/dataSource";
import { createPocketBaseApi } from "./pocketbase/createPocketBaseApi";
import type { AuthApi, ListingsApi, Session } from "./types";

export type { Session };

export * from "./pocketbase";

export type ApiBundle = {
  auth: AuthApi;
  listings: ListingsApi;
  readSession: () => Session | null;
  setCurrentUserId: (userId: string | null) => void;
};

export function createApi(storage: Storage = localStorage): ApiBundle {
  if (resolveCabinetDataSource() === "pocketbase") {
    return createPocketBaseApi(storage);
  }

  let currentUserId: string | null = null;

  const auth = createAuthApi(storage);
  const listings = createListingsApi(storage, () => currentUserId);

  return {
    auth,
    listings,
    readSession: () => {
      const raw = storage.getItem(SESSION_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as Session;
    },
    setCurrentUserId: (userId) => {
      currentUserId = userId;
    },
  };
}
