export const CANCEL_REASON_MAX_LENGTH = 500;

export type AcceptedCancelReason = {
  readonly state: "accepted";
  readonly text: string;
};

export type CancelReason =
  | AcceptedCancelReason
  | { readonly state: "tooLong" };

export function parseCancelReason(raw: string): CancelReason {
  if (raw.length > CANCEL_REASON_MAX_LENGTH) {
    return { state: "tooLong" };
  }

  return { state: "accepted", text: raw };
}
