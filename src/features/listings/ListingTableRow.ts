import type { HousingType } from "../../api/types";
import type { ListingTableStatus } from "./listingTableStatus";

export type ListingTableRow = {
  id: string;
  title: string;
  address: string;
  housingType: HousingType;
  status: ListingTableStatus;
};
