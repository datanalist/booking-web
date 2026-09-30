import type { ListingTabId } from "../../lib/listingTabs";

/** state навигации на `/listings/:id/preview` (вкладка списка, откуда открыли). */
export type ListingPreviewLocationState = {
  fromTab?: ListingTabId;
};
