/**
 * Where a booking goes when the owner rejects a request on it.
 * `restorePreviousStatus` — stays in «Подтверждены» with its previous status;
 * `moveToCancelled` — leaves «Подтверждены» and is written to «Отменены».
 * Product wording was ambiguous («Отмена и отклонение писать во вкладку Отменены»),
 * so switching the behaviour is a one-line change of the value below.
 */
export type RejectedRequestDestination =
  | "restorePreviousStatus"
  | "moveToCancelled";

export const REJECTED_REQUEST_DESTINATION: RejectedRequestDestination =
  "restorePreviousStatus";
