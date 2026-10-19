import { formatRub } from "../../../lib/money";
import type { ConfirmedBookingStatus } from "../presentation/confirmed/confirmedBookingStatus";
import type { PreviousBookingStatus } from "../presentation/confirmed/PreviousBookingStatus";
import { stayFromRecord } from "./pbBookingDisplay";
import { formatRemainingLabel, isStayDay } from "./pbBookingTime";
import type { PbBookingRecord } from "./pbBookingTypes";

function previousConfirmedStatus(record: PbBookingRecord, now: Date): PreviousBookingStatus {
  return isStayDay(record.check_in, record.check_out, now)
    ? { kind: "staying" }
    : { kind: "prepaymentPaid" };
}

/**
 * Отмена запрашивается только из `confirmed`. Перенос дат без предоплаты
 * остаётся ожиданием оплаты — отдельного прошлого статуса в записи нет.
 */
function previousStatus(record: PbBookingRecord, now: Date): PreviousBookingStatus {
  if (record.status === "cancel_requested" || record.prepaid_at.trim() !== "") {
    return previousConfirmedStatus(record, now);
  }
  return {
    kind: "awaitingPrepayment",
    remainingLabel: formatRemainingLabel(record.prepay_until, now),
  };
}

export function pbConfirmedStatus(
  record: PbBookingRecord,
  now: Date,
): ConfirmedBookingStatus | null {
  switch (record.status) {
    case "awaiting_prepayment":
      return {
        kind: "awaitingPrepayment",
        remainingLabel: formatRemainingLabel(record.prepay_until, now),
      };
    case "confirmed":
      return previousConfirmedStatus(record, now);
    case "completed":
      return { kind: "stayCompleted" };
    case "cancel_requested":
      return {
        kind: "request",
        request: { kind: "cancel" },
        previousStatus: previousStatus(record, now),
      };
    case "change_requested": {
      const proposedStay = stayFromRecord(
        record.requested_check_in,
        record.requested_check_out,
      );
      if (proposedStay === null) return previousConfirmedStatus(record, now);
      return {
        kind: "request",
        previousStatus: previousStatus(record, now),
        request: {
          kind: "changeDates",
          proposedStay,
          proposedPriceLabel: formatRub(record.total),
        },
      };
    }
    case "pending_host":
    case "cancelled":
      return null;
  }
}
