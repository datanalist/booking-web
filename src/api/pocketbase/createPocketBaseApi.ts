import { SESSION_KEY } from "../keys";
import type { ApiBundle, Session } from "../index";
import { createPbAuthApi } from "./createPbAuthApi";
import { createPbListingsApi } from "./createPbListingsApi";
import { createCabinetPbClient } from "./pbSession";

export function createPocketBaseApi(storage: Storage): ApiBundle {
  const client = createCabinetPbClient(storage);
  const auth = createPbAuthApi({ client, storage });
  const listings = createPbListingsApi({ client, storage });
  return {
    auth,
    listings,
    readSession: () => {
      const raw = storage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) as Session : null;
    },
    setCurrentUserId: () => {},
  };
}
