import type { ApiBundle } from "../index";
import { createPbAuthApi } from "./createPbAuthApi";
import { createPbListingsApi } from "./createPbListingsApi";
import { createCabinetPbClient, readCabinetSession } from "./pbSession";

export function createPocketBaseApi(storage: Storage): ApiBundle {
  const client = createCabinetPbClient(storage);
  const auth = createPbAuthApi({ client, storage });
  const listings = createPbListingsApi({ client, storage });
  return {
    auth,
    listings,
    readSession: () => readCabinetSession(storage),
    setCurrentUserId: () => {},
  };
}
