import type { ListingsLocationState } from "../../lib/listingTabs";
import { parseListingOriginState } from "./parseListingOriginState";

/**
 * State для перехода на `/listings` по router state страницы-источника:
 * вкладка, откуда пришли; `undefined`, если вкладку определить нельзя.
 */
export function listingsLocationStateFromOrigin(
  state: unknown,
): ListingsLocationState | undefined {
  const { fromTab } = parseListingOriginState(state);
  return fromTab === undefined ? undefined : { tab: fromTab };
}
