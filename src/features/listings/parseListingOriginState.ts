import { isListingTabId } from "../../lib/listingTabs";
import type { ListingPreviewLocationState } from "./ListingPreviewLocationState";

/**
 * Разбирает router state, пришедший из списка «Мои объявления» (вкладка-источник).
 * Неизвестные или некорректные данные дают пустое состояние — вкладку определить нельзя.
 */
export function parseListingOriginState(
  state: unknown,
): ListingPreviewLocationState {
  if (typeof state !== "object" || state === null || !("fromTab" in state)) {
    return {};
  }
  const fromTab: unknown = state.fromTab;
  return isListingTabId(fromTab) ? { fromTab } : {};
}
