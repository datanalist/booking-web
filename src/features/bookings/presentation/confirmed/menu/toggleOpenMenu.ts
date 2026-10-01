import type { ConfirmedBookingId } from "../ConfirmedBookingId";

/**
 * The single source of truth for «какое меню открыто»: at most one row id for the whole table,
 * so two menus can never be open at once. Clicking the open row's trigger closes it;
 * clicking another row's trigger moves the open menu to that row.
 */
export function toggleOpenMenu(
  openMenuId: ConfirmedBookingId | null,
  clickedId: ConfirmedBookingId,
): ConfirmedBookingId | null {
  return openMenuId === clickedId ? null : clickedId;
}
