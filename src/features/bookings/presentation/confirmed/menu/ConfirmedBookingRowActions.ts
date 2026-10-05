import type { ConfirmedBookingId } from "../ConfirmedBookingId";
import type { ConfirmedBookingDialog } from "../dialog/ConfirmedBookingDialog";

/** Table-level state and handlers of the row menus (one open menu for the whole table). */
export type ConfirmedBookingRowActions = {
  openMenuId: ConfirmedBookingId | null;
  onToggleMenu: (bookingId: ConfirmedBookingId) => void;
  onCloseMenu: () => void;
  onOpenDialog: (dialog: ConfirmedBookingDialog) => void;
};
