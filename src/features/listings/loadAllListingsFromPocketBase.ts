import { pbListingToTableRow } from "../../api/pocketbase/listingMapper";
import type { PbClient } from "../../api/pocketbase/pbClient";
import type { PbListingRecord } from "../../api/pocketbase/pbTypes";
import type { ListingTableRow } from "./ListingTableRow";

export async function loadAllListingsFromPocketBase(
  client: PbClient,
  hostId: string,
): Promise<ListingTableRow[]> {
  const result = await client.listRecords<PbListingRecord>("listings", {
    filter: `host="${hostId}"`,
    sort: "-updated",
    perPage: 200,
  });
  return result.items.map((record) => pbListingToTableRow(record, client.baseUrl));
}
